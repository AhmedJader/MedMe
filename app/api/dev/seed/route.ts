import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { patients } from "@/db/schema";

export async function POST() {
  // id's match your mock ids so UI keeps working
  const data = [
    { id: "p1", name: "Ava Thompson", phoneE164:"+14165550101", medication:"Adalimumab 40mg (refrigerated)", nextRefillDate: new Date(Date.now()+2*864e5), lastShipmentIssue: null },
    { id: "p2", name: "Noah Patel",   phoneE164:"+14165550102", medication:"Insulin Glargine (refrigerated)", nextRefillDate: new Date(Date.now()-3*864e5), lastShipmentIssue:"Box arrived warm; requested extra ice-pack." },
    { id: "p3", name: "Mia Chen",     phoneE164:"+14165550103", medication:"Levothyroxine 100mcg", nextRefillDate: new Date(Date.now()+14*864e5), lastShipmentIssue: null },
  ];
  await db.insert(patients).values(data).onConflictDoNothing();
  return NextResponse.json({ ok:true, inserted: data.length });
}
