// // app/api/dev/seed/route.ts
// export const runtime = "nodejs";

// import { NextResponse } from "next/server";
// import { db } from "@/db/db";          // your server-only client
// import { patients } from "@/db/schema";      // import patients directly from schema

// export async function POST() {
//   try {
//     // Do NOT set id if column is UUID
//     const data = [
//       {
//         name: "Ava Thompson",
//         phoneE164: "+14165550101",
//         medication: "Adalimumab 40mg (refrigerated)",
//         nextRefillDate: new Date(Date.now() + 2 * 864e5),
//         lastShipmentIssue: null,
//       },
//       {
//         name: "Noah Patel",
//         phoneE164: "+14165550102",
//         medication: "Insulin Glargine (refrigerated)",
//         nextRefillDate: new Date(Date.now() - 3 * 864e5),
//         lastShipmentIssue: "Box arrived warm; requested extra ice-pack.",
//       },
//       {
//         name: "Mia Chen",
//         phoneE164: "+14165550103",
//         medication: "Levothyroxine 100mcg",
//         nextRefillDate: new Date(Date.now() + 14 * 864e5),
//         lastShipmentIssue: null,
//       },
//     ];

//     // @ts-ignore – adjust import to your actual name
//     await db.insert(patients).values(data);

//     return NextResponse.json({ ok: true, inserted: data.length });
//   } catch (e: any) {
//     console.error("SEED ERROR:", e);
//     return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
//   }
// }
