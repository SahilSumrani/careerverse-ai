"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Person = {
  id: string;
  name?: string | null;
  email: string;
  isDemo?: boolean;
  profile?: { headline?: string | null; careerStage?: string | null } | null;
  mentorProfile?: { expertise?: string | null } | null;
  roles?: Array<{ role: { name: string } }>;
};

type ConnectionRow = {
  id: string;
  status: string;
  message?: string | null;
  requester?: Person;
  receiver?: Person;
};

export default function NetworkPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [sent, setSent] = useState<ConnectionRow[]>([]);
  const [received, setReceived] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/network");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load network");
        return;
      }
      setPeople(data.people || []);
      setSent(data.sent || []);
      setReceived(data.received || []);
    } catch {
      setError("Unable to load network");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function connect(receiverId: string) {
    setBusyId(receiverId);
    setError("");
    try {
      const res = await fetch("/api/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", receiverId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to send request");
        return;
      }
      await load();
    } catch {
      setError("Unable to send request");
    } finally {
      setBusyId(null);
    }
  }

  async function respond(id: string, status: "ACCEPTED" | "REJECTED") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to respond");
        return;
      }
      await load();
    } catch {
      setError("Unable to respond");
    } finally {
      setBusyId(null);
    }
  }

  const pendingReceived = received.filter((c) => c.status === "PENDING");
  const connectedIds = new Set(
    [...sent, ...received].filter((c) => c.status === "ACCEPTED" || c.status === "PENDING").flatMap((c) => {
      const ids: string[] = [];
      if (c.receiver?.id) ids.push(c.receiver.id);
      if (c.requester?.id) ids.push(c.requester.id);
      return ids;
    }),
  );

  return (
    <div>
      <PageHeader
        title="Network"
        description="Discover people, send connection requests, and manage inbound invites."
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection requests</CardTitle>
              <CardDescription>Accept or decline pending invitations.</CardDescription>
            </CardHeader>
            {pendingReceived.length ? (
              <ul className="space-y-3">
                {pendingReceived.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div>
                      <p className="font-medium">{c.requester?.name || "Member"}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.requester?.profile?.headline || c.message || "Wants to connect"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busyId === c.id} onClick={() => void respond(c.id, "ACCEPTED")}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === c.id}
                        onClick={() => void respond(c.id, "REJECTED")}
                      >
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            )}
          </Card>

          <div>
            <h2 className="mb-3 font-display text-xl tracking-tight">People</h2>
            {!people.length ? (
              <EmptyState title="No people to show" description="Profiles will appear here as members join." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {people.map((p) => {
                  const already = connectedIds.has(p.id);
                  return (
                    <Card key={p.id}>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <CardTitle>{p.name || "Member"}</CardTitle>
                          {p.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                        </div>
                        <CardDescription>
                          {p.profile?.headline || p.mentorProfile?.expertise || "CareerVerse member"}
                        </CardDescription>
                      </CardHeader>
                      <div className="mb-3 flex flex-wrap gap-1">
                        {(p.roles || []).map((r) => (
                          <Badge key={r.role.name}>{r.role.name}</Badge>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        disabled={already || busyId === p.id}
                        onClick={() => void connect(p.id)}
                      >
                        {already ? "Requested / connected" : busyId === p.id ? "Sending…" : "Connect"}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
