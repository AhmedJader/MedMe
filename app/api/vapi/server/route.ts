import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  // Log all events so you can see them in Vercel logs
  console.log("Vapi event:", JSON.stringify(body));

  // Tool completion handshake
  if (body.type === "tool-calls") {
    for (const tc of body.toolCalls ?? []) {
      if (tc.toolName === "submit_patient_outcome") {
        const args = typeof tc.args === "string" ? JSON.parse(tc.args) : tc.args;
        console.log("submit_patient_outcome:", args);
        // acknowledge so the agent continues
        return NextResponse.json({ toolCallId: tc.toolCallId, result: { ok: true } });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
