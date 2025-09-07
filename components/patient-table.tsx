"use client";

import * as React from "react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { MOCK_PATIENTS } from "../lib/mock";
import { refillPriority, formatDate, Priority } from "../lib/utils";
import type { Patient } from "../lib/types";
import { StatusBadge } from "./status-badge";
import { PatientDrawer } from "./patient-drawer";

type Filter = "all" | Priority;

export default function PatientTable() {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Patient | null>(null);

  const rows = React.useMemo(() => {
    return MOCK_PATIENTS
      .map(p => ({ p, prio: refillPriority(p.nextRefillDate) }))
      .filter(({ p, prio }) => {
        const text = (p.name + p.medication).toLowerCase();
        const matchesQ = text.includes(query.toLowerCase());
        const matchesF = filter === "all" ? true : prio === filter;
        return matchesQ && matchesF;
      })
      .sort((a,b) => {
        const order = (v: Priority) => v==="overdue"?0: v==="due_soon"?1:2;
        const d = order(a.prio) - order(b.prio);
        if (d !== 0) return d;
        return new Date(a.p.nextRefillDate).getTime() - new Date(b.p.nextRefillDate).getTime();
      });
  }, [query, filter]);

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search patients or meds…"
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              className="w-64"
            />
            <Select value={filter} onValueChange={(v:Filter)=>setFilter(v)}>
              <SelectTrigger className="w-[140px]">
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
          <div className="text-xs text-muted-foreground">
            Overdue & due-soon are automatically prioritized.
          </div>
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
              {rows.map(({ p, prio }) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.phoneE164}</div>
                  </TableCell>
                  <TableCell>{p.medication}</TableCell>
                  <TableCell>{formatDate(p.nextRefillDate)}</TableCell>
                  <TableCell><StatusBadge priority={prio} /></TableCell>
                  <TableCell className="max-w-[360px]">
                    <div className="truncate text-muted-foreground">
                      {p.lastOutcome?.summary ?? p.lastShipmentIssue ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelected(p); setOpen(true); }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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

      <PatientDrawer open={open} onOpenChange={setOpen} patient={selected} />
    </>
  );
}
