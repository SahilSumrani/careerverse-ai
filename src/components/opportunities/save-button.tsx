"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type OppPayload = {
  id: string;
  title: string;
  organizationName?: string | null;
  type?: string;
  matchScore?: number | null;
};

export function SaveOpportunityButton({
  opportunity,
  matchScore,
}: {
  opportunity: OppPayload;
  matchScore?: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunityId: opportunity.id,
        opportunity: {
          id: opportunity.id,
          title: opportunity.title,
          organizationName: opportunity.organizationName ?? null,
          type: opportunity.type || "Full-time",
          isDemo: false,
        },
        matchScore: matchScore ?? opportunity.matchScore ?? null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.push("/applications");
      return;
    }
    setError(data.error || "Unable to save");
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={() => void save()} disabled={busy || done}>
        {done ? "Saved" : busy ? "Saving…" : "Save & track application"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
