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
  lastShipmentIssue: string | null;
};

export function PatientDrawer({
  open, onOpenChange, patient,
}: { open: boolean; onOpenChange: (v: boolean) => void; patient: DBPatient | null }) {

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onOpenChange(false); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const [outcome, setOutcome] = React.useState<any>(null);

  const refreshOutcome = React.useCallback(async () => {
    if (!patient) return;
    const r = await fetch(`/api/outcomes?patientId=${patient.id}`);
    const data = await r.json();
    if (data.ok) setOutcome(data.outcome);
  }, [patient?.id]);

  React.useEffect(() => { if (open && patient) refreshOutcome(); }, [open, patient, refreshOutcome]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader><SheetTitle>{patient?.name ?? "Patient"}</SheetTitle></SheetHeader>

        {!patient ? null : (
          <div className="mt-4 space-y-3 text-sm">
            <div><span className="text-muted-foreground">Phone:</span> {patient.phoneE164}</div>
            <div><span className="text-muted-foreground">Medication:</span> {patient.medication}</div>
            <div><span className="text-muted-foreground">Next refill:</span> {formatDate(patient.nextRefillDate)}</div>

            {patient.lastShipmentIssue && (
              <div className="rounded-md bg-amber-50 text-amber-900 p-3 border border-amber-200">
                Last shipment issue: {patient.lastShipmentIssue}
              </div>
            )}

            <div className="rounded-md bg-muted p-3">
              <div className="font-medium mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Latest conversation
                <button onClick={refreshOutcome} className="ml-auto text-xs underline">Refresh</button>
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
              <CallPatientButton
                patient={patient}
                onEnded={refreshOutcome}  // refresh when call ends
              />
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
