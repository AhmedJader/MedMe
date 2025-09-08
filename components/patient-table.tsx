"use client";
import * as React from "react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { refillPriority, formatDate, Priority } from "../lib/utils";
import { StatusBadge } from "./status-badge";
import { PatientDrawer } from "./patient-drawer";

type Filter = "all" | Priority;

type DBPatient = {
  id: string;
  name: string;
  phoneE164: string;
  medication: string;
  nextRefillDate: string;
  lastShipmentIssue: string | null;
  lastSummary: string | null;   // <-- from server (latest outcome)
  lastMedChange: string | null; // <-- from server (latest outcome)
};

export default function PatientTable({ initialPatients }: { initialPatients: DBPatient[] }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<DBPatient | null>(null);

  // Local patch so the row updates immediately after a call ends
  const [lastById, setLastById] = React.useState<Record<string, { summary: string | null; medChange: string | null }>>(
    () =>
      Object.fromEntries(
        initialPatients.map(p => [
          p.id,
          { summary: p.lastSummary ?? p.lastShipmentIssue ?? null, medChange: p.lastMedChange ?? null }
        ])
      )
  );

  const handleOutcome = React.useCallback(
    (o: { patientId: string; summary?: string; medChange?: string }) => {
      setLastById((m) => {
        const prev = m[o.patientId];
        const next = { summary: o.summary ?? null, medChange: o.medChange ?? null };
        if (prev && prev.summary === next.summary && prev.medChange === next.medChange) return m; // no change
        return { ...m, [o.patientId]: next };
      });
    },
    []
  );

  const rows = React.useMemo(() => {
    return initialPatients
      .map((p) => ({ p, prio: refillPriority(p.nextRefillDate) }))
      .filter(({ p, prio }) => {
        const text = (p.name + p.medication).toLowerCase();
        const matchesQ = text.includes(query.toLowerCase());
        const matchesF = filter === "all" ? true : prio === filter;
        return matchesQ && matchesF;
      })
      .sort((a, b) => {
        const order = (v: Priority) => (v === "overdue" ? 0 : v === "due_soon" ? 1 : 2);
        const d = order(a.prio) - order(b.prio);
        if (d !== 0) return d;
        return new Date(a.p.nextRefillDate).getTime() - new Date(b.p.nextRefillDate).getTime();
      });
  }, [initialPatients, query, filter]);

  function openPatient(p: DBPatient) { setSelected(p); setOpen(true); }

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search patients or meds…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Select value={filter} onValueChange={(v: Filter) => setFilter(v)}>
              <SelectTrigger className="w-[140px] hover:cursor-pointer">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due_soon">Due soon</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground">Overdue &amp; due-soon are automatically prioritized.</div>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Next refill</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Last summary</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ p, prio }) => {
                const latest = lastById[p.id];
                const summary = latest?.summary ?? p.lastSummary ?? p.lastShipmentIssue ?? "—";
                const medChange = latest?.medChange ?? p.lastMedChange ?? null;

                return (
                  <TableRow
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openPatient(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPatient(p); }
                    }}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.phoneE164}</div>
                    </TableCell>
                    <TableCell>{p.medication}</TableCell>
                    <TableCell>{formatDate(p.nextRefillDate)}</TableCell>
                    <TableCell><StatusBadge priority={prio} dateIso={p.nextRefillDate} /></TableCell>
                    <TableCell className="max-w-[420px]">
                      <div className="truncate text-muted-foreground">{summary}</div>
                      {medChange && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">Med change: {medChange}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openPatient(p); }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No patients match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ...table... */}
      <PatientDrawer
        open={open}
        onOpenChange={setOpen}
        patient={selected}
        onOutcome={handleOutcome} // <-- stable identity, no churn
      />
    </>
  );
}
