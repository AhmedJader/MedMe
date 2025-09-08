export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { conversations, outcomes } from "@/db/schema";
import { eq } from "drizzle-orm";

function parseTool(tc: any) {
  const name = tc.toolName ?? tc.function?.name ?? tc.name;
  const rawArgs = tc.args ?? tc.function?.arguments ?? tc.arguments;
  let args = rawArgs;
  try { if (typeof rawArgs === "string") args = JSON.parse(rawArgs); } catch {}
  const id = tc.toolCallId ?? tc.id;
  return { name, args, id };
}

export async function POST(req: Request) {
  const body = await req.json();
  console.log("Vapi event type:", body?.type);

  const callId: string = body?.call?.id || body?.call?.callId || "";
  const transport: string = body?.call?.type === "webCall" ? "web" : "pstn";
  const patientIdFromVars: string | null =
    body?.assistant?.variableValues?.patientId ??
    body?.call?.assistantOverrides?.variableValues?.patientId ?? null;

  try {
    // Ensure a conversation row exists
    if (callId && patientIdFromVars) {
      const existing = await db.select().from(conversations).where(eq(conversations.vendorCallId, callId));
      if (!existing.length) {
        await db.insert(conversations).values({
          vendorCallId: callId,
          patientId: patientIdFromVars,
          transport,
          status: "in_progress",
        });
      }
    }

    // Handle tool-calls
    if (body?.type === "tool-calls") {
      for (const rawTc of body.toolCalls ?? []) {
        const tc = parseTool(rawTc);
        if (tc.name === "submit_patient_outcome") {
          const patientId = patientIdFromVars || tc.args.patientId;

          const [conv] = callId
            ? await db.select().from(conversations).where(eq(conversations.vendorCallId, callId))
            : [];
          if (conv?.id) {
            await db.insert(outcomes).values({
              conversationId: conv.id,
              patientId,
              availabilityWindow: String(tc.args.availabilityWindow ?? ""),
              medChange: String(tc.args.medChange ?? "").toLowerCase(),
              shipmentIssue: tc.args.shipmentFeedback ?? null,
              summary: String(tc.args.summary ?? ""),
              raw: tc.args,
            }).onConflictDoNothing();

            await db.update(conversations)
              .set({ status: "done", endedAt: new Date() })
              .where(eq(conversations.id, conv.id));
          }

          // ACK so the agent continues
          return NextResponse.json({ toolCallId: rawTc.toolCallId ?? rawTc.id, result: { ok: true } });
        }
      }
    }

    // Optional: transcript / finalization
    if (body?.type === "end-of-call-report" && callId) {
      const [conv] = await db.select().from(conversations).where(eq(conversations.vendorCallId, callId));
      if (conv?.id) {
        await db.update(conversations)
          .set({ transcript: body.artifact?.transcript ?? null, endedAt: new Date(), status: "done" })
          .where(eq(conversations.id, conv.id));
      }
    }
  } catch (e: any) {
    console.error("VAPI SERVER DB ERROR:", e?.message, e);
  }

  return NextResponse.json({ ok: true });
}
