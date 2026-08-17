"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/states";
import "@/styles/admin-console.css";

type DetailPayload = {
  user: {
    id: string;
    name: string | null;
    email: string;
    roles: string[];
    registration: Record<string, unknown> | null;
    recruiterApproved: boolean;
    mentorApproved: boolean;
    suspendedAt: string | null;
    onboardingComplete: boolean;
    createdAt: string;
    updatedAt: string;
    education: string | null;
    degree: string | null;
    college: string | null;
    graduationYear: number | null;
    careerGoals: string | null;
    skills: string[];
    interests: string[];
    preferredIndustries: string[];
    preferredLocations: string[];
    workPreference: string | null;
    careerStage: string | null;
    resumes: Array<{ fileName: string; uploadedAt: string }>;
  };
  applications: Array<{
    id: string;
    opportunityId: string | null;
    status: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  analyticsEvents: Array<{
    id: string;
    name: string;
    props: Record<string, unknown> | null;
    createdAt: string | null;
  }>;
  aiUsage: Array<{
    id: string;
    operation: string;
    model: string | null;
    tokensIn: number;
    tokensOut: number;
    success: boolean;
    createdAt: string | null;
  }>;
};

const REGISTRATION_FIELDS: Record<string, Array<[string, string]>> = {
  student: [
    ["Education level", "educationLevel"],
    ["Institution", "institution"],
    ["Course", "course"],
    ["Graduation year", "graduationYear"],
    ["Preferred role", "preferredRole"],
    ["Resume supplied", "hasResume"],
  ],
  mentor: [
    ["Current organization", "currentOrganization"],
    ["Expertise", "expertise"],
    ["Years of experience", "yearsExperience"],
    ["Mentoring experience", "mentoringExperience"],
    ["Motivation", "motivation"],
    ["Achievements", "achievements"],
    ["Available days", "availabilityDays"],
    ["Hours per week", "hoursPerWeek"],
    ["Languages", "languages"],
    ["Mentee audience", "menteeAudience"],
  ],
  hr: [
    ["Company", "companyName"],
    ["Company type", "companyType"],
    ["Registration number", "registrationNumber"],
    ["GST number", "gstNumber"],
    ["Industry", "industry"],
    ["Website", "companyWebsite"],
    ["Job title", "jobTitle"],
    ["Company size", "companySize"],
    ["Phone", "phone"],
    ["Address line 1", "address1"],
    ["Address line 2", "address2"],
    ["City", "city"],
    ["State", "state"],
    ["PIN code", "pinCode"],
    ["Company description", "companyDescription"],
  ],
};

function date(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "—";
}

function value(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function DataList({ rows }: { rows: Array<[string, unknown]> }) {
  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
      {rows.map(([label, rowValue]) => (
        <div key={label} className="rounded-xl border border-border bg-white p-3">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words text-sm">{value(rowValue)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminUserDetail({ id, currentAdminId }: { id: string; currentAdminId: string }) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}`);
      const json = await response.json();
      if (!response.ok) {
        setError(json.error || "Unable to load user detail");
        setData(null);
        return;
      }
      setData(json as DetailPayload);
    } catch {
      setError("Unable to load user detail");
      setData(null);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial protected API fetch
    void load();
  }, [load]);

  async function act(action: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error || "Action failed");
        return;
      }
      await load();
    } catch {
      setError("Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (!data && !error) return <Skeleton className="h-72 w-full rounded-2xl" />;
  if (!data) {
    return (
      <EmptyState
        title="User unavailable"
        description={error || "This user could not be loaded."}
        action={
          <Link href="/admin?tab=users" className={buttonVariants({ variant: "outline" })}>
            Back to users
          </Link>
        }
      />
    );
  }

  const user = data.user;
  const track = typeof user.registration?.track === "string" ? user.registration.track : "student";
  const registrationRows = (REGISTRATION_FIELDS[track] || []).map(
    ([label, key]) => [label, user.registration?.[key]] as [string, unknown],
  );
  const isRecruiter = track === "hr" || user.roles.includes("HR");
  const isMentor = track === "mentor" || user.roles.includes("MENTOR");
  const isSelf = user.id === currentAdminId;

  return (
    <div className="cv-admin">
      <div>
        <Link href="/admin?tab=users" className="text-sm font-medium text-primary hover:underline">
          ← Back to users
        </Link>
        <PageHeader
          title={user.name || user.email}
          description={`${user.email} · ${user.roles.join(", ") || "STUDENT"}`}
        />
      </div>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

      <section className="cv-admin-card" aria-labelledby="account-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="account-heading">Account</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={user.suspendedAt ? "warning" : "success"}>
                {user.suspendedAt ? "Suspended" : "Active"}
              </Badge>
              <Badge tone="info">{track}</Badge>
              {isMentor ? <Badge tone={user.mentorApproved ? "success" : "warning"}>Mentor {user.mentorApproved ? "approved" : "pending"}</Badge> : null}
              {isRecruiter ? <Badge tone={user.recruiterApproved ? "success" : "warning"}>Recruiter {user.recruiterApproved ? "approved" : "pending"}</Badge> : null}
            </div>
          </div>
          {!isSelf ? (
            <div className="flex flex-wrap gap-2" aria-label="Admin actions">
              <Button
                size="sm"
                variant={user.suspendedAt ? "outline" : "destructive"}
                disabled={busy}
                onClick={() => void act(user.suspendedAt ? "unsuspend_user" : "suspend_user")}
              >
                {user.suspendedAt ? "Unsuspend" : "Suspend"}
              </Button>
              {isMentor ? (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void act(user.mentorApproved ? "revoke_mentor" : "approve_mentor")}>
                  {user.mentorApproved ? "Revoke mentor" : "Approve mentor"}
                </Button>
              ) : null}
              {isRecruiter ? (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void act(user.recruiterApproved ? "revoke_recruiter" : "approve_recruiter")}>
                  {user.recruiterApproved ? "Revoke recruiter" : "Approve recruiter"}
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Self-account controls are disabled.</p>
          )}
        </div>
        <DataList
          rows={[
            ["Roles", user.roles.join(", ")],
            ["Registration track", track],
            ["Onboarding complete", user.onboardingComplete],
            ["Created", date(user.createdAt)],
            ["Updated", date(user.updatedAt)],
            ["Suspended", date(user.suspendedAt)],
          ]}
        />
      </section>

      <section className="cv-admin-card" aria-labelledby="registration-heading">
        <h2 id="registration-heading">Registration details</h2>
        <p className="sub">Submitted fields for the {track} registration track.</p>
        {registrationRows.length ? (
          <DataList rows={registrationRows} />
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No registration details recorded.</p>
        )}
      </section>

      {track === "student" ? (
        <section className="cv-admin-card" aria-labelledby="profile-heading">
          <h2 id="profile-heading">Student profile and preferences</h2>
          <DataList
            rows={[
              ["Education", user.education],
              ["Degree", user.degree],
              ["College", user.college],
              ["Graduation year", user.graduationYear],
              ["Career stage", user.careerStage],
              ["Career goals", user.careerGoals],
              ["Work preference", user.workPreference],
              ["Skills", user.skills.join(", ")],
              ["Interests", user.interests.join(", ")],
              ["Preferred industries", user.preferredIndustries.join(", ")],
              ["Preferred locations", user.preferredLocations.join(", ")],
            ]}
          />
        </section>
      ) : null}

      <section className="cv-admin-card" aria-labelledby="resume-heading">
        <h2 id="resume-heading">Resume metadata</h2>
        <p className="sub">File names and upload dates only.</p>
        <div className="cv-admin-feed">
          {user.resumes.map((resume, index) => (
            <div key={`${resume.fileName}-${resume.uploadedAt}-${index}`} className="row">
              <div className="title">{resume.fileName}</div>
              <div className="meta">{date(resume.uploadedAt)}</div>
            </div>
          ))}
          {!user.resumes.length ? <p className="text-sm text-muted-foreground">No resume metadata.</p> : null}
        </div>
      </section>

      <div className="cv-admin-grid cv-admin-grid-main">
        <section className="cv-admin-card" aria-labelledby="applications-heading">
          <h2 id="applications-heading">Applications</h2>
          <div className="cv-admin-feed">
            {data.applications.map((application) => (
              <div key={application.id} className="row">
                <div className="title">{application.status || "Unknown status"}</div>
                <div className="meta">Application {application.id}</div>
                <div className="meta">Opportunity {application.opportunityId || "—"}</div>
                <div className="meta">Created {date(application.createdAt)} · Updated {date(application.updatedAt)}</div>
              </div>
            ))}
            {!data.applications.length ? <p className="text-sm text-muted-foreground">No applications.</p> : null}
          </div>
        </section>

        <section className="cv-admin-card" aria-labelledby="ai-heading">
          <h2 id="ai-heading">AI usage</h2>
          <div className="cv-admin-feed">
            {data.aiUsage.map((event) => (
              <div key={event.id} className="row">
                <div className="title">{event.operation}{event.success ? "" : " · failed"}</div>
                <div className="meta">{event.model || "No model"} · in {event.tokensIn}/out {event.tokensOut}</div>
                <div className="meta">{date(event.createdAt)}</div>
              </div>
            ))}
            {!data.aiUsage.length ? <p className="text-sm text-muted-foreground">No AI usage.</p> : null}
          </div>
        </section>
      </div>

      <section className="cv-admin-card" aria-labelledby="activity-heading">
        <h2 id="activity-heading">Recent activity</h2>
        <div className="cv-admin-feed">
          {data.analyticsEvents.map((event) => (
            <div key={event.id} className="row">
              <div className="title">{event.name}</div>
              <div className="meta">{date(event.createdAt)}</div>
              {event.props ? <pre className="mt-2 overflow-auto text-xs text-muted-foreground">{JSON.stringify(event.props, null, 2)}</pre> : null}
            </div>
          ))}
          {!data.analyticsEvents.length ? <p className="text-sm text-muted-foreground">No tracked activity.</p> : null}
        </div>
      </section>
    </div>
  );
}
