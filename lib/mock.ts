import type { Patient } from "./types";

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "p1",
    name: "Ava Thompson",
    phoneE164: "+14165550101",
    medication: "Adalimumab 40mg (refrigerated)",
    nextRefillDate: new Date(Date.now() + 2*86400000).toISOString(),
    lastOutcome: {
      availabilityWindow: "Tue–Thu 4–7pm ET",
      medChange: "none",
      shipmentIssue: null,
      summary: "No change in dosing; prefers evening deliveries.",
      confidence: 0.9,
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: "p2",
    name: "Noah Patel",
    phoneE164: "+14165550102",
    medication: "Insulin Glargine (refrigerated)",
    nextRefillDate: new Date(Date.now() - 3*86400000).toISOString(),
    lastShipmentIssue: "Box arrived warm; requested extra ice-pack.",
    lastOutcome: null,
  },
  {
    id: "p3",
    name: "Mia Chen",
    phoneE164: "+14165550103",
    medication: "Levothyroxine 100mcg",
    nextRefillDate: new Date(Date.now() + 14*86400000).toISOString(),
    lastOutcome: {
      availabilityWindow: "Mon 9–12",
      medChange: "delayed",
      shipmentIssue: null,
      summary: "Delayed a few doses while traveling.",
      confidence: 0.7,
      updatedAt: new Date().toISOString(),
    },
  },
];
