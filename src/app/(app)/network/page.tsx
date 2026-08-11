"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, UserPlus } from "lucide-react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { createSoftCache } from "@/lib/client-cache";

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

type NetworkCache = {
  people: Person[];
  sent: ConnectionRow[];
  received: ConnectionRow[];
};
const networkCache = createSoftCache<NetworkCache>();

export default function NetworkPage() {
  const cached = networkCache.peek();
  const [people, setPeople] = useState<Person[]>(cached?.people ?? []);
  const [sent, setSent] = useState<ConnectionRow[]>(cached?.sent ?? []);
  const [received, setReceived] = useState<ConnectionRow[]>(cached?.received ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (opts?: { soft?: boolean }) => {
    const soft = opts?.soft ?? networkCache.has();
    if (!soft) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/network");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load network");
        return;
      }
      const next = {
        people: (data.people || []) as Person[],
        sent: (data.sent || []) as ConnectionRow[],
        received: (data.received || []) as ConnectionRow[],
      };
      setPeople(next.people);
      setSent(next.sent);
      setReceived(next.received);
      networkCache.set(next);
    } catch {
      setError("Unable to load network");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ soft: networkCache.has() });
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
      await load({ soft: true });
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
      await load({ soft: true });
    } catch {
      setError("Unable to respond");
    } finally {
      setBusyId(null);
    }
  }

  const pendingReceived = received.filter((c) => c.status === "PENDING");
  const connectedIds = new Set(
    [...sent, ...received]
      .filter((c) => c.status === "ACCEPTED" || c.status === "PENDING")
      .flatMap((c) => {
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
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Connection requests</CardTitle>
              <CardDescription>Accept or decline pending invitations.</CardDescription>
            </CardHeader>
            {pendingReceived.length ? (
              <ul className="space-y-3">
                {pendingReceived.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={c.requester?.name} />
                      <div>
                        <p className="font-medium">{c.requester?.name || "Member"}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.requester?.profile?.headline || c.message || "Wants to connect"}
                        </p>
                      </div>
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
                  const accepted = [...sent, ...received].some(
                    (c) =>
                      c.status === "ACCEPTED" &&
                      (c.receiver?.id === p.id || c.requester?.id === p.id),
                  );
                  return (
                    <Card key={p.id} className="flex h-full flex-col overflow-hidden p-0">
                      <div className="flex items-start gap-3 border-b border-border px-4 py-4">
                        <Avatar name={p.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base">{p.name || "Member"}</CardTitle>
                            {p.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                          </div>
                          <CardDescription className="mt-0.5 line-clamp-2">
                            {p.profile?.headline || p.mentorProfile?.expertise || "CareerVerse member"}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col px-4 py-4">
                        <div className="mb-3 flex flex-wrap gap-1">
                          {(p.roles || []).map((r) => (
                            <Badge key={r.role.name}>{r.role.name}</Badge>
                          ))}
                          {p.profile?.careerStage ? <Badge tone="default">{p.profile.careerStage}</Badge> : null}
                        </div>
                        <div className="mt-auto flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            disabled={already || busyId === p.id}
                            onClick={() => void connect(p.id)}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            {accepted
                              ? "Connected"
                              : already
                                ? "Requested"
                                : busyId === p.id
                                  ? "Sending…"
                                  : "Connect"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={!accepted}
                            title={accepted ? "Messaging comes next" : "Connect first"}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Message
                          </Button>
                        </div>
                      </div>
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
