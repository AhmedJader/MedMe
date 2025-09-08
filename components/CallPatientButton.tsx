"use client";
import * as React from "react";
import Vapi from "@vapi-ai/web";
import { Button } from "./ui/button";

// Minimal DB row shape used by the button
type DBPatient = {
  id: string;
  name: string;
  medication: string;
  nextRefillDate: string; // page.tsx serializes to ISO string
};

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");

export function CallPatientButton({
  patient,
  onEnded,
}: {
  patient: DBPatient;
  onEnded?: () => void;
}) {
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "";
  const [busy, setBusy] = React.useState(false);

  // keep latest onEnded without re-subscribing
  const endedRef = React.useRef(onEnded);
  React.useEffect(() => { endedRef.current = onEnded; }, [onEnded]);

  React.useEffect(() => {
    const onStart = () => setBusy(true);
    const onEnd = () => { setBusy(false); endedRef.current?.(); };
    const onError = (e: any) => {
      // Ignore benign Daily "ejected / meeting ended" noise
      const t = e?.error?.type ?? e?.type;
      const m = e?.errorMsg ?? e?.msg;
      if (t === "ejected" || m === "Meeting has ended") return;
      console.error("VAPI error", e);
      setBusy(false);
    };

    vapi.on("call-start", onStart);
    vapi.on("call-end", onEnd);
    vapi.on("error", onError);

    return () => {
      (vapi as any).removeListener?.("call-start", onStart);
      (vapi as any).removeListener?.("call-end", onEnd);
      (vapi as any).removeListener?.("error", onError);
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
        patientId: patient.id,            // EXACT id for your tool
        expectedName: patient.name,
        medication: patient.medication,
        nextRefillDate: patient.nextRefillDate,
      },
    });
  }

  return (
    <Button className="gap-2 hover:cursor-pointer" onClick={start} disabled={busy || !assistantId}>
      {busy ? "On call…" : "Call patient (web test)"}
    </Button>
  );
}
