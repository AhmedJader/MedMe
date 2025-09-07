import KpiCards from "../components/kpi-cards";
import PatientTable from "../components/patient-table";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Patients</h1>
        <p className="text-sm text-muted-foreground">
          Monitor upcoming refills and prepare outreach. Stage 2 will enable AI calling from here.
        </p>
      </div>

      <KpiCards />
      <PatientTable />
    </div>
  );
}
