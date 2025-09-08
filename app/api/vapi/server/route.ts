export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { conversations, outcomes } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Safely pull an id for this call, even if the payload shape varies */
function extractCallId(body: any): string | null {
  return (
    body?.call?.id ||
    body?.call?.callId ||
    body?.artifact?.call?.id ||           // some Vapi events nest under artifact
    body?.artifact?.callId ||
    null
  );
}

/** Pull assistant variables regardless of nesting */
function extractVars(body: any): Record<string, any> {
  return (
    body?.assistant?.variableValues ||
    body?.call?.assistantOverrides?.variableValues ||
    body?.artifact?.assistant?.variableValues ||
    {}
  );
}

/** Get the event type across shapes */
function extractType(body: any): string | undefined {
  return body?.type || body?.message?.type || body?.event;
}

/** Normalize tool calls across shapes */
function extractToolCalls(body: any) {
  // Vapi sometimes sends toolCalls at different keys
  const raw =
    body?.toolCalls ||
    body?.message?.toolCalls ||
    body?.toolCallList ||
    (Array.isArray(body?.toolWithToolCallList)
      ? body.toolWithToolCallList.map((x: any) => x.toolCall)
      : []);

  return (raw || []).map((tc: any) => {
    const name =
      tc?.toolName ||
      tc?.function?.name ||
      tc?.name ||
      tc?.tool?.name ||
      "unknown";

    const rawArgs = tc?.args ?? tc?.function?.arguments ?? tc?.arguments ?? {};
    let args = rawArgs;
    if (typeof rawArgs === "string") {
      try { args = JSON.parse(rawArgs); } catch { args = {}; }
    }

    const id = tc?.toolCallId || tc?.id || tc?.callId || "";
    return { name, args, id };
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  const type = extractType(body);
  const callId = extractCallId(body);
  const vars = extractVars(body);
  const patientIdFromVars: string | null = vars?.patientId ?? null;
  const transport = body?.call?.type === "webCall" ? "web" : "pstn";

  // Helpful log (trim giant payloads)
  try {
    console.log("VAPI evt:", {
      type,
      callId,
      patientIdFromVars,
      toolCount:
        (body?.toolCalls?.length ??
          body?.message?.toolCalls?.length ??
          body?.toolCallList?.length ??
          body?.toolWithToolCallList?.length ??
          0),
    });
  } catch {}

  try {
    // Ensure a conversation row exists as soon as we can associate a patient+call
    if (callId && patientIdFromVars) {
      const existing = await db
        .select()
        .from(conversations)
        .where(eq(conversations.vendorCallId, callId));

      if (!existing.length) {
        await db.insert(conversations).values({
          vendorCallId: callId,
          patientId: patientIdFromVars,
          transport: transport || "web",
          status: "in_progress",
        });
      }
    }

    // Handle tool calls (this is where the structured data arrives)
    if (type === "tool-calls") {
      for (const tc of extractToolCalls(body)) {
        if (tc.name !== "submit_patient_outcome") continue;

        const patientId: string =
          patientIdFromVars || String(tc.args.patientId || "");

        // If Vapi didn’t echo call info on this event, try to find/create a conversation row now
        let conversationId: string | undefined;
        if (callId) {
          const [conv] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.vendorCallId, callId));
          if (conv?.id) conversationId = conv.id;
        }

        if (!conversationId && patientIdFromVars) {
          // Create a conversation row with a synthetic vendor id so FK is satisfied
          const synthetic = `web-${Date.now()}`;
          await db.insert(conversations).values({
            vendorCallId: synthetic,
            patientId: patientIdFromVars,
            transport: "web",
            status: "in_progress",
          });
          const [conv] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.vendorCallId, synthetic));
          conversationId = conv?.id;
        }

        if (conversationId) {
          await db
            .insert(outcomes)
            .values({
              conversationId,
              patientId,
              availabilityWindow: String(tc.args.availabilityWindow ?? ""),
              medChange: String(tc.args.medChange ?? "").toLowerCase(),
              shipmentIssue: tc.args.shipmentFeedback ?? null,
              summary: String(tc.args.summary ?? ""),
              raw: tc.args,
            })
            .onConflictDoNothing();

          await db
            .update(conversations)
            .set({ status: "done", endedAt: new Date() })
            .where(eq(conversations.id, conversationId));
        }

        // Acknowledge the tool so the agent proceeds
        return NextResponse.json({
          toolCallId: tc.id,
          result: { ok: true },
        });
      }
    }

    // Optional transcript/finalization
    if (type === "end-of-call-report" && callId) {
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.vendorCallId, callId));

      if (conv?.id) {
        await db
          .update(conversations)
          .set({
            transcript: body?.artifact?.transcript ?? null,
            endedAt: new Date(),
            status: "done",
          })
          .where(eq(conversations.id, conv.id));
      }
    }
  } catch (e: any) {
    console.error("VAPI SERVER DB ERROR:", e?.message, e);
  }

  return NextResponse.json({ ok: true });
}
