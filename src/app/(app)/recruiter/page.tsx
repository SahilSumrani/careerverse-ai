"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import "@/styles/cv-product.css";
import "@/styles/recruiter-console.css";

type JobRow = { id: string; title: string; organizationName: string; type: string; location: string };
type Applicant = {
  id: string;
  status: string;
  userId?: string;
  applicant?: { name?: string | null; email?: string | null } | null;
  opportunity?: { title?: string; organizationName?: string };
  updatedAt?: string;
  matchScore?: number | null;
  careerScore?: number | null;
  skills?: string[];
  matchReasons?: string[];
};
type Talent = {
  id: string;
  name: string | null;
  careerScore: number;
  skills: string[];
  percentileBand: string;
  matchScore?: number | null;
  matchReasons?: string[];
};

const PIPELINE: Array<{ status: string; label: string }> = [
  { status: "ASSESSMENT", label: "Review" },
  { status: "INTERVIEW", label: "Interview" },
  { status: "OFFER", label: "Offer" },
  { status: "HIRED", label: "Hire" },
  { status: "REJECTED", label: "Reject" },
];

export default function RecruiterPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [talent, setTalent] = useState<Talent[]>([]);
  const [scoredCount, setScoredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [copied, setCopied] = useState(false);
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
        const nextJobs = (jJson.items || []).map(
          (i: { id: string; title: string; organizationName: string; type: string; location: string }) => ({
            id: i.id,
            title: i.title,
            organizationName: i.organizationName,
            type: i.type,
            location: i.location,
          }),
        );
        setJobs(nextJobs);
        setSelectedJobId((prev) => prev || nextJobs[0]?.id || "");
      }
      if (aRes.ok) {
        setApplicants(aJson.items || []);
        setApproved(true);
      } else if (aRes.status === 403) {
        setApplicants([]);
        setApproved(false);
        setCompanyName(typeof aJson.companyName === "string" ? aJson.companyName : null);
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

  useEffect(() => {
    if (approved !== true) return;
    let cancelled = false;
    void (async () => {
      try {
        const tRes = await fetch(
          `/api/recruiter/talent${selectedJobId ? `?jobId=${encodeURIComponent(selectedJobId)}` : ""}`,
        );
        const tJson = await tRes.json();
        if (cancelled) return;
        if (tRes.ok) {
          setTalent(tJson.items || []);
          setScoredCount(Number(tJson.scoredCount || 0));
        } else {
          setTalent([]);
        }
      } catch {
        if (!cancelled) setTalent([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [approved, selectedJobId]);

  const jobLink = useMemo(() => {
    if (!selectedJobId || typeof window === "undefined") return "";
    return `${window.location.origin}/opportunities/${selectedJobId}`;
  }, [selectedJobId]);

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

  async function setStatus(applicationId: string, status: string) {
    setUpdatingId(applicationId);
    setError("");
    try {
      const res = await fetch("/api/recruiter/applicants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to update applicant");
        return;
      }
      setApplicants((prev) => prev.map((row) => (row.id === applicationId ? { ...row, status } : row)));
    } catch {
      setError("Unable to update applicant");
    } finally {
      setUpdatingId(null);
    }
  }

  async function copyJobLink() {
    if (!jobLink) return;
    try {
      await navigator.clipboard.writeText(jobLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Unable to copy job link");
    }
  }

  if (!loading && approved === false) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <PageHeader title="Recruiter console" description="Job posting and hiring unlock after admin approval." />
        <div className="cv-panel cv-recruiter-gate">
          <Badge tone="warning">Pending approval</Badge>
          <h2 className="mt-3 text-lg font-semibold">Waiting for admin approval</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {companyName ? (
              <>
                Registration for <strong className="text-foreground">{companyName}</strong> is in review. You cannot
                post jobs, view applicants, or browse Top Talent until an admin approves your recruiter account.
              </>
            ) : (
              "Your company recruiter account is in review. Tools stay locked until an admin approves you."
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Recruiter console"
        description="Post roles, move applicants through hiring, and browse Top Talent (score 90+ in the top 20%)."
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
              <Button type="submit" disabled={busy}>
                {busy ? "Publishing…" : "Publish job"}
              </Button>
            </form>

            <div className="space-y-4">
              <section className="cv-panel p-4">
                <h2 className="text-sm font-semibold">Your jobs</h2>
                {jobs.length ? (
                  <ul className="mt-3 space-y-2">
                    {jobs.map((j) => (
                      <li key={j.id}>
                        <button
                          type="button"
                          className="w-full rounded-xl border border-border px-3 py-2 text-left text-sm"
                          data-active={selectedJobId === j.id}
                          onClick={() => setSelectedJobId(j.id)}
                        >
                          <p className="font-medium">{j.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {j.organizationName} · {j.type} · {j.location}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState className="mt-3 border-0" title="No jobs yet" description="Publish your first role." />
                )}
              </section>

              <section className="cv-panel p-4">
                <h2 className="text-sm font-semibold">Applicants</h2>
                <p className="mt-1 text-xs text-muted-foreground">Sorted by skill match, then career score.</p>
                {applicants.length ? (
                  <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                    {applicants.map((a) => (
                      <li key={a.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{a.applicant?.name || a.applicant?.email || "Applicant"}</p>
                          <Badge tone={a.status === "HIRED" ? "success" : a.status === "REJECTED" ? "warning" : "info"}>
                            {a.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {a.opportunity?.title || "Application"}
                          {a.applicant?.email ? ` · ${a.applicant.email}` : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {a.matchScore != null ? (
                            <Badge tone="accent" className="cv-recruiter-score">
                              {a.matchScore}% match
                            </Badge>
                          ) : null}
                          {a.careerScore != null ? (
                            <Badge className="cv-recruiter-score">Score {a.careerScore}</Badge>
                          ) : null}
                          {(a.skills || []).slice(0, 4).map((skill) => (
                            <Badge key={skill} tone="default">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="cv-recruiter-actions mt-2">
                          {PIPELINE.map((step) => (
                            <Button
                              key={step.status}
                              size="sm"
                              variant={step.status === "HIRED" ? "default" : "outline"}
                              disabled={updatingId === a.id || a.status === step.status}
                              onClick={() => void setStatus(a.id, step.status)}
                            >
                              {step.label}
                            </Button>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No applicants yet.</p>
                )}
              </section>
            </div>
          </div>

          <section className="cv-panel mx-4 mb-4 p-4 md:mx-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Top Talent</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Students with career score 90+ who are also in the top 20% of scored profiles
                  {scoredCount ? ` (${scoredCount} scored)` : ""}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {jobs.length ? (
                  <select
                    aria-label="Match Top Talent to a job"
                    className="h-9 rounded-xl border border-border bg-card px-2 text-xs"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                  >
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        Match: {job.title}
                      </option>
                    ))}
                  </select>
                ) : null}
                <Button size="sm" variant="outline" disabled={!jobLink} onClick={() => void copyJobLink()}>
                  {copied ? "Copied" : "Copy job link"}
                </Button>
              </div>
            </div>
            {talent.length ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {talent.map((row) => (
                  <li key={row.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{row.name || "Student"}</p>
                      <Badge tone="accent" className="cv-recruiter-score">
                        {row.careerScore}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Top 20%
                      {row.matchScore != null ? ` · ${row.matchScore}% skill match` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {row.skills.slice(0, 6).map((skill) => (
                        <Badge key={skill} tone="default">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                className="mt-3 border-0"
                title="No Top Talent yet"
                description="This list fills when students complete career analysis and reach score 90+ in the top quintile."
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
