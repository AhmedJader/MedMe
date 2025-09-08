"use client";

import * as React from "react";
import Vapi from "@vapi-ai/web";
import type { Patient } from "../lib/types";
import { Button } from "./ui/button";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");

export function CallPatientButton({ patient }: { patient: Patient }) {
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "";
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    vapi.on("call-start", () => setBusy(true));
    vapi.on("call-end", () => setBusy(false));
    vapi.on("error", (e) => {
      console.error(e);
      setBusy(false);
    });
  }, []);

  async function start() {
    if (!assistantId || !process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      alert("Vapi env keys missing"); return;
    }
    // Start a WebRTC voice call in the browser (no phone number needed)
    await vapi.start(assistantId, {
      variableValues: {
        patientId: patient.id,
        expectedName: patient.name,
        medication: patient.medication,
        nextRefillDate: patient.nextRefillDate,
      },
    });
  }

  return (
    <Button className="gap-2" onClick={start} disabled={busy || !assistantId}>
      {busy ? "On call…" : "Call patient (web test)"}
    </Button>
  );
}
