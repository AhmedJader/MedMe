// app/page.tsx
import KpiCards from "@/components/kpi-cards";
import PatientTable from "@/components/patient-table";
import { db } from "@/db/db";
import { sql } from "drizzle-orm";

// Always fetch fresh data
export const revalidate = 0;

type Row = {
  id: string;
  name: string;
  phoneE164: string;
  medication: string;
  nextRefillDate: string | Date;
  lastShipmentIssue: string | null;
  lastSummary: string | null;
  lastMedChange: string | null;
};

export default async function Home() {
  // One row per patient + latest outcome (summary/medChange)
  const result = await db.execute<Row>(sql`
    select
      p.id,
      p.name,
      p.phone_e164 as "phoneE164",
      p.medication,
      p.next_refill_date as "nextRefillDate",
      p.last_shipment_issue as "lastShipmentIssue",
      lo.summary as "lastSummary",
      lo.med_change as "lastMedChange"
    from patients p
    left join lateral (
      select o.summary, o.med_change
      from outcomes o
      where o.patient_id = p.id
      order by o.created_at desc
      limit 1
    ) lo on true
    order by p.name
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows; // postgres-js returns array
  const initialPatients = rows.map((r: Row) => ({
    ...r,
    nextRefillDate:
      typeof r.nextRefillDate === "string"
        ? r.nextRefillDate
        : (r.nextRefillDate as Date)?.toISOString?.() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Patients</h1>
        <p className="text-sm text-muted-foreground">
          Monitor upcoming refills and trigger AI outreach. Latest outcomes are shown in the drawer.
        </p>
      </div>

      <KpiCards patients={initialPatients} />
      <PatientTable initialPatients={initialPatients as any[]} />
    </div>
  );
}
