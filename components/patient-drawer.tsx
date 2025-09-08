"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import type { Patient } from "../lib/types";
import { formatDate } from "../lib/utils";
import { FileText, Phone } from "lucide-react";
import { CallPatientButton } from "./CallPatientButton";

export function PatientDrawer({
  open, onOpenChange, patient,
}: { open: boolean; onOpenChange: (v: boolean) => void; patient: Patient | null }) {

  // Extra safety: close on Esc even if focus is outside the sheet root
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <SheetHeader>
          <SheetTitle>{patient?.name ?? "Patient"}</SheetTitle>
        </SheetHeader>

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
                <FileText className="h-4 w-4" /> Last conversation (if any)
              </div>
              {patient.lastOutcome ? (
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">Availability:</span> {patient.lastOutcome.availabilityWindow ?? "—"}</p>
                  <p><span className="text-muted-foreground">Med change:</span> {patient.lastOutcome.medChange ?? "—"}</p>
                  <p><span className="text-muted-foreground">Shipment issue:</span> {patient.lastOutcome.shipmentIssue ?? "None"}</p>
                  <p><span className="text-muted-foreground">Summary:</span> {patient.lastOutcome.summary ?? "—"}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No prior AI call on record.</p>
              )}
            </div>

            {/* Stage 2 placeholder */}
            <div className="pt-2">
              <CallPatientButton patient={patient} />
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
