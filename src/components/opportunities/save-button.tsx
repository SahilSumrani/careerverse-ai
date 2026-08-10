"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SaveOpportunityButton({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.push("/applications");
    }
  }

  return (
    <Button onClick={() => void save()} disabled={busy || done}>
      {done ? "Saved" : busy ? "Saving…" : "Save & track application"}
    </Button>
  );
}
