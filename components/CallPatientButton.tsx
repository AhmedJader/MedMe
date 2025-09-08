"use client";
import * as React from "react";
import Vapi from "@vapi-ai/web";
import type { Patient } from "../lib/types";
import { Button } from "./ui/button";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");

export function CallPatientButton({
  patient,
  onEnded,
}: {
  patient: Patient;
  onEnded?: () => void;
}) {
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "";
  const [busy, setBusy] = React.useState(false);

  // keep latest onEnded without re-subscribing
  const endedRef = React.useRef(onEnded);
  React.useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  React.useEffect(() => {
    const onStart = () => setBusy(true);
    const onEnd = () => {
      setBusy(false);
      endedRef.current?.();
    };
    const onError = (e: any) => {
      console.error("VAPI error", e);
      setBusy(false);
    };

    vapi.on("call-start", onStart);
    vapi.on("call-end", onEnd);
    vapi.on("error", onError);

    // cleanup to prevent MaxListeners warnings
    return () => {
      (vapi as any).removeListener?.("call-start", onStart);
      (vapi as any).removeListener?.("call-end", onEnd);
      (vapi as any).removeListener?.("error", onError);
      // fallback (older SDKs)
      (vapi as any).events?.off?.("call-start", onStart);
      (vapi as any).events?.off?.("call-end", onEnd);
      (vapi as any).events?.off?.("error", onError);
    };
  }, []);

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
