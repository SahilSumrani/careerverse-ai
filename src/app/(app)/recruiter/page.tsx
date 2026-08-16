"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import "@/styles/cv-product.css";

type JobRow = { id: string; title: string; organizationName: string; type: string; location: string };
type Applicant = {
  id: string;
  status: string;
  userId?: string;
  applicant?: { name?: string | null; email?: string | null } | null;
  opportunity?: { title?: string; organizationName?: string };
  updatedAt?: string;
  matchScore?: number | null;
};

export default function RecruiterPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "Bangalore",
    type: "Full-time",
    workMode: "Hybrid",
    salary: "",
    tags: "React, TypeScript",
    blurb: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jRes, aRes] = await Promise.all([
        fetch("/api/opportunities?mine=1"),
        fetch("/api/recruiter/applicants"),
      ]);
      const jJson = await jRes.json();
      const aJson = await aRes.json();
      if (!jRes.ok) {
        setError(jJson.error || "Unable to load jobs");
        setJobs([]);
      } else {
        setJobs(
          (jJson.items || []).map((i: { id: string; title: string; organizationName: string; type: string; location: string }) => ({
            id: i.id,
            title: i.title,
            organizationName: i.organizationName,
            type: i.type,
            location: i.location,
          })),
        );
      }
      if (aRes.ok) {
        setApplicants(aJson.items || []);
        setApproved(true);
      } else if (aRes.status === 403) {
        setApplicants([]);
        setApproved(false);
        setError(aJson.error || "Recruiter not approved");
      } else {
        setError(aJson.error || "Unable to load applicants");
      }
    } catch {
      setError("Unable to load recruiter console");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial client fetch
    void load();
  }, [load]);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          company: form.company,
          location: form.location,
          type: form.type,
          workMode: form.workMode,
          salary: form.salary || undefined,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          blurb: form.blurb,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to publish");
        return;
      }
      setForm((f) => ({ ...f, title: "", blurb: "", salary: "" }));
      await load();
    } catch {
      setError("Unable to publish");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Recruiter console"
        description="Post roles and review applicants. Requires HR role + admin approval (recruiterApproved)."
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="cv-shell">
          <div className="cv-shell-inner grid gap-6 p-4 md:grid-cols-2 md:p-6">
            <form className="cv-panel space-y-3 p-4" onSubmit={(e) => void publish(e)}>
              <h2 className="text-sm font-semibold">Publish a role</h2>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tags">Skills (comma-separated)</Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="blurb">Description</Label>
                <textarea
                  id="blurb"
                  required
                  minLength={20}
                  className="min-h-28 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  value={form.blurb}
                  onChange={(e) => setForm({ ...form, blurb: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={busy || approved === false}>
                {approved === false ? "Approval pending" : busy ? "Publishing…" : "Publish job"}
              </Button>
            </form>

            <div className="space-y-4">
              <section className="cv-panel p-4">
                <h2 className="text-sm font-semibold">Your jobs</h2>
                {jobs.length ? (
                  <ul className="mt-3 space-y-2">
                    {jobs.map((j) => (
                      <li key={j.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                        <p className="font-medium">{j.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {j.organizationName} · {j.type} · {j.location}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState className="mt-3 border-0" title="No jobs yet" description="Publish your first role." />
                )}
              </section>

              <section className="cv-panel p-4">
                <h2 className="text-sm font-semibold">Applicants</h2>
                {applicants.length ? (
                  <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                    {applicants.map((a) => (
                      <li key={a.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{a.opportunity?.title || "Application"}</p>
                          <Badge>{a.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {a.applicant?.name || a.applicant?.email || (a.userId ? `${a.userId.slice(0, 8)}…` : "Applicant")}
                          {a.applicant?.name && a.applicant.email ? ` · ${a.applicant.email}` : ""}
                          {a.matchScore != null ? ` · ${a.matchScore}% match` : ""}
                          {a.updatedAt ? ` · ${String(a.updatedAt).slice(0, 10)}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No applicants yet.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
