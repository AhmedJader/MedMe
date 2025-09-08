"use client";
import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { formatDate } from "../lib/utils";
import { FileText } from "lucide-react";
import { CallPatientButton } from "./CallPatientButton";

type DBPatient = {
  id: string;
  name: string;
  phoneE164: string;
  medication: string;
  nextRefillDate: string;
  lastShipmentIssue: string | null; // kept in type, but not shown
};

export function PatientDrawer({
  open,
  onOpenChange,
  patient,
  onOutcome,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patient: DBPatient | null;
  onOutcome?: (o: { patientId: string; summary?: string; medChange?: string }) => void;
}) {
  // Close on ESC
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onOpenChange(false); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const [outcome, setOutcome] = React.useState<any>(null);

  // Keep a stable ref to onOutcome
  const onOutcomeRef = React.useRef(onOutcome);
  React.useEffect(() => { onOutcomeRef.current = onOutcome; }, [onOutcome]);

  // throttle + in-flight guard
  const lastFetchRef = React.useRef<{ id: string | null; ts: number; inFlight: boolean }>({
    id: null, ts: 0, inFlight: false,
  });

  const refreshOutcome = React.useCallback(
    async (force = false) => {
      if (!patient) return;
      const now = Date.now();

      const tooSoon =
        lastFetchRef.current.id === patient.id &&
        now - lastFetchRef.current.ts < 1200 &&
        !force;

      if (tooSoon || lastFetchRef.current.inFlight) return;

      lastFetchRef.current = { id: patient.id, ts: now, inFlight: true };

      const ac = new AbortController();
      try {
        const r = await fetch(`/api/outcomes?patientId=${patient.id}`, {
          cache: "no-store",
          signal: ac.signal,
        });
        const data = await r.json();
        if (data.ok) {
          setOutcome(data.outcome);
          onOutcomeRef.current?.({
            patientId: patient.id,
            summary: data.outcome?.summary,
            medChange: data.outcome?.medChange,
          });
        }
      } finally {
        lastFetchRef.current.inFlight = false;
      }
    },
    [patient?.id]
  );

  // fetch on open or when patient changes
  const prevOpenRef = React.useRef(open);
  React.useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (open && !wasOpen && patient) {
      refreshOutcome(true); // first open: force fetch
    } else if (open && patient) {
      refreshOutcome();
    }
  }, [open, patient?.id, refreshOutcome]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{patient?.name ?? "Patient"}</SheetTitle>
        </SheetHeader>

        {!patient ? null : (
          <div className="mt-4 space-y-3 text-sm">
            <div><span className="text-muted-foreground">Phone:</span> {patient.phoneE164}</div>
            <div><span className="text-muted-foreground">Medication:</span> {patient.medication}</div>
            <div><span className="text-muted-foreground">Next refill:</span> {formatDate(patient.nextRefillDate)}</div>

            {/* Latest conversation only */}
            <div className="rounded-md bg-muted p-3">
              <div className="font-medium mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Latest conversation
                <button onClick={() => refreshOutcome(true)} className="ml-auto text-xs underline">
                  Refresh
                </button>
              </div>
              {outcome ? (
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">Availability:</span> {outcome.availabilityWindow ?? "—"}</p>
                  <p><span className="text-muted-foreground">Med change:</span> {outcome.medChange ?? "—"}</p>
                  <p><span className="text-muted-foreground">Shipment issue:</span> {outcome.shipmentIssue ?? "None"}</p>
                  <p><span className="text-muted-foreground">Summary:</span> {outcome.summary ?? "—"}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No AI call on record yet.</p>
              )}
            </div>

            <div className="pt-2">
              <CallPatientButton patient={patient} onEnded={() => refreshOutcome(true)} />
              <p className="text-xs text-muted-foreground mt-2">
                Web test mode — browser mic only (no phone number).
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
