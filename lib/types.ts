export type MedChange = "none" | "skipped" | "delayed" | "other";

export type Patient = {
  id: string;
  name: string;
  phoneE164: string;
  medication: string;
  nextRefillDate: string; // ISO
  lastShipmentIssue?: string | null;
  lastOutcome?: {
    availabilityWindow?: string;
    medChange?: MedChange;
    shipmentIssue?: string | null;
    summary?: string;
    confidence?: number;
    updatedAt?: string;
  } | null;
};
