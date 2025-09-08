"use client";
import * as React from "react";
import Vapi from "@vapi-ai/web";
import type { Patient } from "../lib/types";
import { Button } from "./ui/button";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");

export function CallPatientButton({
  patient,
  onEnded,
}: { patient: Patient; onEnded?: () => void }) {
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "";
  const [busy, setBusy] = React.useState(false);

  // keep latest onEnded without re-adding listeners
  const onEndedRef = React.useRef(onEnded);
  React.useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  React.useEffect(() => {
    const handleStart = () => setBusy(true);
    const handleEnd   = () => { setBusy(false); onEndedRef.current?.(); };
    const handleError = (e: any) => {
      // Daily often emits this on normal hangup — ignore
      if (e?.error?.type === "ejected" || e?.errorMsg === "Meeting has ended") {
        setBusy(false);
        onEndedRef.current?.();
        return;
      }
      console.error("vapi error:", e);
      setBusy(false);
    };

    vapi.on("call-start", handleStart);
    vapi.on("call-end",   handleEnd);
    vapi.on("error",      handleError);

    return () => {
      vapi.off("call-start", handleStart);
      vapi.off("call-end",   handleEnd);
      vapi.off("error",      handleError);
    };
  }, []); // add once

  async function start() {
    if (!assistantId || !process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      alert("Vapi env keys missing");
      return;
    }
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
