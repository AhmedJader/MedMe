import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MOCK_PATIENTS } from "../lib/mock";
import { refillPriority, daysUntil } from "../lib/utils";
import { AlertTriangle, CalendarClock, Snowflake } from "lucide-react";

export default function KpiCards() {
  const overdue = MOCK_PATIENTS.filter(p => daysUntil(p.nextRefillDate) < 0).length;
  const dueSoon = MOCK_PATIENTS.filter(p => {
    const d = daysUntil(p.nextRefillDate);
    return d >= 0 && d <= 7;
  }).length;
  const coldChain = MOCK_PATIENTS.filter(p =>
    /refrigerated/i.test(p.medication)
  ).length;

  const Item = ({
    icon: Icon, label, value, tone,
  }: { icon: any; label: string; value: number | string; tone: "red" | "amber" | "blue" }) => {
    const toneCls = {
      red:   "bg-red-50 text-red-700 border-red-200",
      amber: "bg-amber-50 text-amber-800 border-amber-200",
      blue:  "bg-sky-50 text-sky-700 border-sky-200",
    }[tone];
    return (
      <Card className={`border ${toneCls}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          <Icon className="h-4 w-4 opacity-70" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{value}</div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Item icon={AlertTriangle} label="Overdue refills" value={overdue} tone="red" />
      <Item icon={CalendarClock} label="Due in next 7 days" value={dueSoon} tone="amber" />
      <Item icon={Snowflake} label="Cold-chain meds" value={coldChain} tone="blue" />
    </div>
  );
}
