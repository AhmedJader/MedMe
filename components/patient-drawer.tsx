"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import type { Patient } from "../lib/types";
import { formatDate } from "../lib/utils";
import { FileText, Phone } from "lucide-react";

export function PatientDrawer({
  open, onOpenChange, patient,
}: { open: boolean; onOpenChange: (v: boolean) => void; patient: Patient | null }) {
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
              <Button variant="secondary" disabled className="gap-2" title="Stage 2: Retell outbound call">
                <Phone className="h-4 w-4" /> Call patient (AI)
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Placeholder only. Stage 2 will enable this to trigger the voice agent and persist results.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
