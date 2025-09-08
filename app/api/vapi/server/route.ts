export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { conversations, outcomes } from "@/db/schema";
import { eq } from "drizzle-orm";

// -------- helpers (unchanged) ----------
function extractCallId(body: any): string | null {
  return body?.call?.id || body?.call?.callId || body?.artifact?.call?.id || body?.artifact?.callId || null;
}
function extractVars(body: any): Record<string, any> {
  return body?.assistant?.variableValues
    || body?.call?.assistantOverrides?.variableValues
    || body?.artifact?.assistant?.variableValues
    || {};
}
function extractType(body: any): string | undefined {
  return body?.type || body?.message?.type || body?.event;
}
function extractToolCalls(body: any) {
  const raw = body?.toolCalls
    || body?.message?.toolCalls
    || body?.toolCallList
    || (Array.isArray(body?.toolWithToolCallList) ? body.toolWithToolCallList.map((x: any) => x.toolCall) : []);
  return (raw || []).map((tc: any) => {
    const name = tc?.toolName || tc?.function?.name || tc?.name || tc?.tool?.name || "unknown";
    const rawArgs = tc?.args ?? tc?.function?.arguments ?? tc?.arguments ?? {};
    let args = rawArgs;
    if (typeof rawArgs === "string") { try { args = JSON.parse(rawArgs); } catch { args = {}; } }
    const id = tc?.toolCallId || tc?.id || tc?.callId || "";
    return { name, args, id, _raw: tc };
  });
}
// ---------------------------------------

export async function POST(req: Request) {
  const body = await req.json();

  const type = extractType(body);
  const callId = extractCallId(body);
  const vars = extractVars(body);
  const patientIdFromVars: string | null = vars?.patientId ?? null;
  const transport = body?.call?.type === "webCall" ? "web" : "pstn";

  console.log("VAPI evt:", {
    type,
    callId: callId ?? null,
    patientIdFromVars: patientIdFromVars ?? null,
    toolCount:
      (body?.toolCalls?.length ??
        body?.message?.toolCalls?.length ??
        body?.toolCallList?.length ??
        body?.toolWithToolCallList?.length ??
        0),
  });

  try {
    // If we *do* have a callId + vars, create the conversation up-front
    if (callId && patientIdFromVars) {
      const existing = await db.select().from(conversations).where(eq(conversations.vendorCallId, callId));
      if (!existing.length) {
        await db.insert(conversations).values({
          vendorCallId: callId,
          patientId: patientIdFromVars,
          transport: transport || "web",
          status: "in_progress",
        });
      }
    }

    // Structured data arrives here
    if (type === "tool-calls") {
      for (const tc of extractToolCalls(body)) {
        if (tc.name !== "submit_patient_outcome") continue;

        // We always have this in the tool args (per your prompt)
        const patientId: string = patientIdFromVars || String(tc.args.patientId || "");

        // Find or create a conversation row so FK is satisfied
        let conversationId: string | undefined;

        if (callId) {
          const [conv] = await db.select().from(conversations).where(eq(conversations.vendorCallId, callId));
          conversationId = conv?.id;
        }

        // ↙️ NEW: if there was no callId (your case), create a synthetic conversation using the arg patientId
        if (!conversationId && patientId) {
          const syntheticVendorId = `tool-${tc.id || Date.now()}`;
          await db.insert(conversations).values({
            vendorCallId: syntheticVendorId,
            patientId,
            transport: "web",
            status: "in_progress",
          });
          const [conv2] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.vendorCallId, syntheticVendorId));
          conversationId = conv2?.id;
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
            .onConflictDoNothing(); // retries safe

          await db
            .update(conversations)
            .set({ status: "done", endedAt: new Date() })
            .where(eq(conversations.id, conversationId));
        } else {
          console.error("VAPI SERVER: could not derive conversationId; payload:", JSON.stringify(tc.args));
        }

        // ACK the tool so the agent proceeds
        return NextResponse.json({ toolCallId: tc.id, result: { ok: true } });
      }
    }

    // Optional: end-of-call transcript
    if (type === "end-of-call-report" && callId) {
      const [conv] = await db.select().from(conversations).where(eq(conversations.vendorCallId, callId));
      if (conv?.id) {
        await db
          .update(conversations)
          .set({ transcript: body?.artifact?.transcript ?? null, endedAt: new Date(), status: "done" })
          .where(eq(conversations.id, conv.id));
      }
    }
  } catch (e: any) {
    console.error("VAPI SERVER DB ERROR:", e?.message, e);
  }

  return NextResponse.json({ ok: true });
}
