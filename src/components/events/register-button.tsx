"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RegisterButton({
  eventId,
  disabled,
  alreadyRegistered,
}: {
  eventId: string;
  disabled?: boolean;
  alreadyRegistered?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(!!alreadyRegistered);
  const [error, setError] = useState("");

  async function register() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to register");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Unable to register");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={() => void register()} disabled={disabled || busy || done}>
        {done ? "RSVP saved" : busy ? "Saving…" : "RSVP"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
