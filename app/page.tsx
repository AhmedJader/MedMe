// app/page.tsx
import KpiCards from "../components/kpi-cards";
import PatientTable from "../components/patient-table";
import { db } from "@/db/db";
import { patients } from "@/db/schema";

// Always fetch fresh data on each request (handy while iterating)
export const revalidate = 0;

export default async function Home() {
  // Query Neon (Server Component — runs on the server)
  const rows = await db.select().from(patients);

  // Serialize Dates for client components
  const initialPatients = rows.map((p) => ({
    ...p,
    nextRefillDate:
      typeof p.nextRefillDate === "string"
        ? p.nextRefillDate
        : p.nextRefillDate?.toISOString?.() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Patients</h1>
        <p className="text-sm text-muted-foreground">
          Monitor upcoming refills and trigger AI outreach. Latest outcomes are shown in the drawer.
        </p>
      </div>

      {/* If you kept KPI cards, pass data into them */}
      <KpiCards patients={initialPatients} />

      {/* Table now uses real DB data */}
      <PatientTable initialPatients={initialPatients} />
    </div>
  );
}
