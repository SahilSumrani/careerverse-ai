"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";

const TYPES = ["student_verification", "internship", "job", "event_participation"] as const;

type ApprovalItem = {
  id: string;
  type: string;
  status: string;
  decisionNote?: string | null;
  createdAt: string;
  institutionId?: string | null;
};

type Institution = {
  id: string;
  organization?: { name?: string | null } | null;
};

export default function InstitutionsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("student_verification");
  const [institutionId, setInstitutionId] = useState("");
  const [payloadNote, setPayloadNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/approvals");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load approvals");
        return;
      }
      setItems(data.items || []);
      const insts: Institution[] = data.institutions || [];
      setInstitutions(insts);
      setInstitutionId((prev) => prev || insts[0]?.id || "");
    } catch {
      setError("Unable to load approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          institutionId: institutionId || undefined,
          payload: { note: payloadNote || undefined },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to submit request");
        return;
      }
      setPayloadNote("");
      await load();
    } catch {
      setError("Unable to submit request");
    } finally {
      setBusy(false);
    }
  }

  const statusTone = (status: string) =>
    status === "APPROVED" ? "success" : status === "REJECTED" ? "warning" : "accent";

  return (
    <div>
      <PageHeader
        title="Institutions & approvals"
        description="Request student verification, internship/job confirmation, or event participation review."
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <Card className="mb-6 max-w-xl">
        <CardHeader>
          <CardTitle>New approval request</CardTitle>
          <CardDescription>Submitted requests appear below with their current status.</CardDescription>
        </CardHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="approval-type">Type</Label>
            <Select id="approval-type" value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution">Institution (optional)</Label>
            <Select id="institution" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
              <option value="">None</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.organization?.name || `Institution ${inst.id.slice(0, 8)}`}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Notes</Label>
            <Textarea
              id="note"
              value={payloadNote}
              onChange={(e) => setPayloadNote(e.target.value)}
              placeholder="Context for reviewers…"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      </Card>

      {loading ? (
        <Skeleton className="h-32" />
      ) : !items.length ? (
        <EmptyState title="No requests yet" description="Submit a verification or confirmation request to get started." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium capitalize">{item.type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                  {item.decisionNote ? (
                    <p className="mt-2 text-sm text-muted-foreground">{item.decisionNote}</p>
                  ) : null}
                </div>
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
