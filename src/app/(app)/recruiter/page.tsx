"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlusCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

import { RecruiterKpiCards } from "./components/RecruiterKpiCards";
import {
  CandidatePipelineTable,
  type Applicant,
} from "./components/CandidatePipelineTable";
import {
  TalentPoolSection,
  type JobRow,
  type Talent,
} from "./components/TalentPoolSection";
import { PipelineBreakdownChart } from "./components/PipelineBreakdownChart";
import { ActiveJobsList } from "./components/ActiveJobsList";
import { PostRoleModal, type PostRoleFormState } from "./components/PostRoleModal";

export default function RecruiterPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [talent, setTalent] = useState<Talent[]>([]);
  const [, setScoredCount] = useState(0);
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

  const [form, setForm] = useState<PostRoleFormState>({
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

      {/* 4 Pastel KPI Cards */}
      <RecruiterKpiCards jobsCount={jobs.length} stats={stats} />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left 8-cols: Candidate Pipeline Table & Talent Pool */}
        <div className="space-y-6 lg:col-span-8">
          <CandidatePipelineTable
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            loading={loading}
            filteredApplicants={filteredApplicants}
            updatingId={updatingId}
            onSetStatus={setStatus}
          />

          <TalentPoolSection
            jobs={jobs}
            talent={talent}
            selectedJobId={selectedJobId}
            setSelectedJobId={setSelectedJobId}
            onCopyJobLink={() => void copyJobLink()}
            copied={copied}
          />
        </div>

        {/* Right 4-cols: Pipeline Donut & Your Live Jobs */}
        <div className="space-y-6 lg:col-span-4">
          <PipelineBreakdownChart stats={stats} />

          <ActiveJobsList
            jobs={jobs}
            selectedJobId={selectedJobId}
            setSelectedJobId={setSelectedJobId}
          />
        </div>
      </div>

      {/* Post New Role Modal */}
      <PostRoleModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        form={form}
        setForm={setForm}
        onPublish={publish}
        busy={busy}
      />
    </div>
  );
}
