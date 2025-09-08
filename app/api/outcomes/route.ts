export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { outcomes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const patientId = new URL(req.url).searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ ok: false, error: "patientId required" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(outcomes)
    .where(eq(outcomes.patientId, patientId))
    .orderBy(desc(outcomes.createdAt))
    .limit(1);

  return NextResponse.json({ ok: true, outcome: row ?? null });
}
