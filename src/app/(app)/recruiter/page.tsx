"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Video,
  Award,
  PlusCircle,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  ChevronRight,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/states";

type JobRow = {
  id: string;
  title: string;
  organizationName: string;
  type: string;
  location: string;
};

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

const PIPELINE_STAGES = [
  { status: "APPLIED", label: "Applied", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { status: "ASSESSMENT", label: "Review", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { status: "INTERVIEW", label: "Interview", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { status: "OFFER", label: "Offer", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { status: "HIRED", label: "Hired", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { status: "REJECTED", label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200" },
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
  const [showPostModal, setShowPostModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "Bangalore",
    type: "Full-time",
    workMode: "Hybrid",
    salary: "",
    tags: "React, TypeScript, Next.js",
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
          })
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
    void load();
  }, [load]);

  useEffect(() => {
    if (approved !== true) return;
    let cancelled = false;
    void (async () => {
      try {
        const tRes = await fetch(
          `/api/recruiter/talent${selectedJobId ? `?jobId=${encodeURIComponent(selectedJobId)}` : ""}`
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
      setForm({
        title: "",
        company: "",
        location: "Bangalore",
        type: "Full-time",
        workMode: "Hybrid",
        salary: "",
        tags: "React, TypeScript, Next.js",
        blurb: "",
      });
      setShowPostModal(false);
      await load();
    } catch {
      setError("Unable to publish role");
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
      setApplicants((prev) =>
        prev.map((row) => (row.id === applicationId ? { ...row, status } : row))
      );
    } catch {
      setError("Unable to update applicant status");
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

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((a) => {
      const name = a.applicant?.name || a.applicant?.email || "";
      const matchesSearch =
        !searchFilter ||
        name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (a.opportunity?.title || "").toLowerCase().includes(searchFilter.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || a.status.toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [applicants, searchFilter, statusFilter]);

  // Status counts for pipeline
  const stats = useMemo(() => {
    const total = applicants.length;
    const review = applicants.filter((a) => a.status === "ASSESSMENT").length;
    const interview = applicants.filter((a) => a.status === "INTERVIEW").length;
    const offer = applicants.filter((a) => a.status === "OFFER").length;
    const hired = applicants.filter((a) => a.status === "HIRED").length;
    const rejected = applicants.filter((a) => a.status === "REJECTED").length;
    return { total, review, interview, offer, hired, rejected };
  }, [applicants]);

  if (!loading && approved === false) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Waiting for Admin Approval</h2>
          <p className="mt-2 text-sm text-slate-600">
            {companyName ? (
              <>
                Registration for <strong className="font-semibold text-slate-900">{companyName}</strong> is
                currently in review. You will be notified as soon as an administrator unlocks your hiring workspace.
              </>
            ) : (
              "Your recruiter account is pending review. Job posting and candidate discovery will be active once approved."
            )}
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 transition"
            >
              Back to Personal Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Hiring Command Center</h1>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
              Recruiter Mode
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage your open listings, review applicants, and source top-scoring verified candidates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowPostModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Post New Role
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {/* 4 Pastel KPI Cards (Matches Reference Mockups) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Lavender (Active Roles) */}
        <div className="group relative overflow-hidden rounded-3xl border border-violet-100/80 bg-violet-50/80 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-violet-700 shadow-xs">
              <TrendingUp className="h-3 w-3" /> Active
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600/90">
              Open Positions
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">{jobs.length}</p>
            <p className="mt-1 text-xs text-violet-700/80">Live vacancies published</p>
          </div>
        </div>

        {/* Card 2: Peach / Amber (Total Applicants) */}
        <div className="group relative overflow-hidden rounded-3xl border border-amber-100/80 bg-amber-50/80 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-amber-700 shadow-xs">
              Pipeline
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600/90">
              Total Applicants
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">{stats.total}</p>
            <p className="mt-1 text-xs text-amber-700/80">Across all posted jobs</p>
          </div>
        </div>

        {/* Card 3: Rose / Pink (In Interview) */}
        <div className="group relative overflow-hidden rounded-3xl border border-rose-100/80 bg-rose-50/80 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm">
              <Video className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-rose-700 shadow-xs">
              Rounds
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600/90">
              In Interview
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">{stats.interview}</p>
            <p className="mt-1 text-xs text-rose-700/80">Candidates progressing</p>
          </div>
        </div>

        {/* Card 4: Sky / Cyan (Hired) */}
        <div className="group relative overflow-hidden rounded-3xl border border-sky-100/80 bg-sky-50/80 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
              <Award className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-sky-700 shadow-xs">
              Offers
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600/90">
              Total Hires
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">{stats.hired}</p>
            <p className="mt-1 text-xs text-sky-700/80">Successful placements</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left 8-cols: Candidate Pipeline Table & Filters */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Candidate Pipeline</h2>
                <p className="text-xs text-slate-500">
                  Manage application stages, review AI match scores, and make hiring decisions.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1">
                {["ALL", "ASSESSMENT", "INTERVIEW", "OFFER", "HIRED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                      statusFilter === st
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {st === "ALL" ? "All" : st === "ASSESSMENT" ? "Review" : st.charAt(0) + st.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidate by name, email, or role..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Applicants Table */}
            <div className="mt-6 overflow-x-auto">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full rounded-2xl" />
                  <Skeleton className="h-12 w-full rounded-2xl" />
                  <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
              ) : filteredApplicants.length ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="pb-3 font-semibold uppercase tracking-wider">Candidate</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Applied Role</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Match Score</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Status</th>
                      <th className="pb-3 text-right font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplicants.map((a) => {
                      const name = a.applicant?.name || a.applicant?.email || "Candidate";
                      const initials = name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <tr key={a.id} className="group hover:bg-slate-50/60 transition">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 font-bold text-indigo-700 shadow-xs">
                                {initials}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{name}</p>
                                <p className="text-[11px] text-slate-400">{a.applicant?.email || "No email"}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 font-semibold text-slate-700">
                            {a.opportunity?.title || "Application"}
                          </td>

                          <td className="py-4">
                            <div className="flex items-center gap-1.5">
                              {a.matchScore != null ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 border border-emerald-200/60">
                                  <Sparkles className="h-3 w-3" />
                                  {a.matchScore}%
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                              {a.careerScore != null && (
                                <span className="rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-700 border border-violet-200/50">
                                  {a.careerScore} pts
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                a.status === "HIRED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : a.status === "OFFER"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : a.status === "INTERVIEW"
                                  ? "bg-violet-50 text-violet-700 border-violet-200"
                                  : a.status === "ASSESSMENT"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : a.status === "REJECTED"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  a.status === "HIRED"
                                    ? "bg-emerald-500"
                                    : a.status === "OFFER"
                                    ? "bg-blue-500"
                                    : a.status === "INTERVIEW"
                                    ? "bg-violet-500"
                                    : a.status === "ASSESSMENT"
                                    ? "bg-amber-500"
                                    : a.status === "REJECTED"
                                    ? "bg-rose-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              {a.status === "ASSESSMENT" ? "In Review" : a.status}
                            </span>
                          </td>

                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {a.status !== "INTERVIEW" && a.status !== "HIRED" && (
                                <button
                                  type="button"
                                  disabled={updatingId === a.id}
                                  onClick={() => void setStatus(a.id, "INTERVIEW")}
                                  className="rounded-xl border border-violet-200 bg-violet-50/80 px-2.5 py-1 font-bold text-violet-700 hover:bg-violet-100 transition"
                                >
                                  Interview
                                </button>
                              )}
                              {a.status !== "HIRED" && (
                                <button
                                  type="button"
                                  disabled={updatingId === a.id}
                                  onClick={() => void setStatus(a.id, "HIRED")}
                                  className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 font-bold text-emerald-700 hover:bg-emerald-100 transition"
                                >
                                  Hire
                                </button>
                              )}
                              {a.status !== "REJECTED" && (
                                <button
                                  type="button"
                                  disabled={updatingId === a.id}
                                  onClick={() => void setStatus(a.id, "REJECTED")}
                                  className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-800">No applicants found</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Share your job links or browse Top Talent to invite candidates.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Top Talent Sourcing Pool */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Top Talent Sourcing Pool</h2>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    Top 20%
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Pre-screened students scoring 90+ career readiness with verified skill match.
                </p>
              </div>

              {jobs.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        Match against: {j.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {talent.length ? (
                talent.slice(0, 6).map((cand) => (
                  <div
                    key={cand.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-indigo-200 hover:bg-white hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">{cand.name || "Student Candidate"}</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800">
                          Score {cand.careerScore}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {cand.matchScore != null ? (
                          <span className="font-semibold text-emerald-600">
                            {cand.matchScore}% skill alignment
                          </span>
                        ) : (
                          "Top quintile candidate"
                        )}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {cand.skills.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/50 pt-3">
                      <span className="text-[11px] font-bold text-indigo-600">Verified Profile</span>
                      <button
                        type="button"
                        onClick={() => void copyJobLink()}
                        className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition"
                      >
                        <Copy className="h-3 w-3" />
                        {copied ? "Link Copied!" : "Invite Link"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                  No scored students currently match this role.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 4-cols: Pipeline Donut & Your Live Jobs */}
        <div className="space-y-6 lg:col-span-4">
          {/* Pipeline Donut Summary (Inspired by Image 1 & 2) */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Pipeline Breakdown</h3>
            <p className="text-xs text-slate-500">Real-time candidate progression</p>

            <div className="mt-6 flex flex-col items-center">
              {/* Donut SVG */}
              <div className="relative flex h-40 w-40 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                  {/* Segment 1: Review (Amber) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#f59e0b"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${Math.max(
                      (stats.review / Math.max(stats.total, 1)) * 238.7,
                      2
                    )} 238.7`}
                    strokeLinecap="round"
                  />
                  {/* Segment 2: Interview (Violet) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#8b5cf6"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${Math.max(
                      (stats.interview / Math.max(stats.total, 1)) * 238.7,
                      2
                    )} 238.7`}
                    strokeDashoffset={-((stats.review / Math.max(stats.total, 1)) * 238.7)}
                    strokeLinecap="round"
                  />
                  {/* Segment 3: Hired (Emerald) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#10b981"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${Math.max(
                      (stats.hired / Math.max(stats.total, 1)) * 238.7,
                      2
                    )} 238.7`}
                    strokeDashoffset={
                      -(((stats.review + stats.interview) / Math.max(stats.total, 1)) * 238.7)
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Flow
                  </span>
                </div>
              </div>

              {/* Legends with colored indicator dots */}
              <div className="mt-6 w-full space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-amber-50/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-700">In Review</span>
                  </div>
                  <span className="font-bold text-slate-900">{stats.review}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-violet-50/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    <span className="font-semibold text-slate-700">Interview Stage</span>
                  </div>
                  <span className="font-bold text-slate-900">{stats.interview}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700">Hired & Placed</span>
                  </div>
                  <span className="font-bold text-slate-900">{stats.hired}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Job Listings */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Your Active Jobs</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {jobs.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {jobs.length ? (
                jobs.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => setSelectedJobId(j.id)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                      selectedJobId === j.id
                        ? "border-indigo-500 bg-indigo-50/30 shadow-xs"
                        : "border-slate-100 bg-slate-50/40 hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900">{j.title}</p>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Active
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {j.organizationName} · {j.location}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                      <span className="font-semibold text-indigo-600">{j.type}</span>
                      <Link
                        href={`/opportunities/${j.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Public page <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  You haven&apos;t posted any roles yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post New Role Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Publish a New Vacancy</h3>
                <p className="text-xs text-slate-500">Directly syncs to CareerVerse Opportunity Board.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={(e) => void publish(e)}>
              <div>
                <Label htmlFor="title" className="text-xs font-bold text-slate-700">
                  Role Title *
                </Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-xs font-bold text-slate-700">
                  Hiring Company *
                </Label>
                <Input
                  id="company"
                  required
                  placeholder="e.g. Acme Technologies"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="location" className="text-xs font-bold text-slate-700">
                    Location *
                  </Label>
                  <Input
                    id="location"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="salary" className="text-xs font-bold text-slate-700">
                    Salary Range
                  </Label>
                  <Input
                    id="salary"
                    placeholder="e.g. ₹18 LPA - ₹25 LPA"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags" className="text-xs font-bold text-slate-700">
                  Required Skills (comma-separated)
                </Label>
                <Input
                  id="tags"
                  placeholder="React, TypeScript, GraphQL, Node.js"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="blurb" className="text-xs font-bold text-slate-700">
                  Role Description & Expectations *
                </Label>
                <textarea
                  id="blurb"
                  required
                  minLength={20}
                  placeholder="Describe the candidate responsibilities, qualifications, and company culture..."
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={form.blurb}
                  onChange={(e) => setForm({ ...form, blurb: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPostModal(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
                >
                  {busy ? "Publishing…" : "Publish Listing"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
