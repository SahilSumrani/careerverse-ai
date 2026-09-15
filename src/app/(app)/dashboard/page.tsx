import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Sparkles,
  Users,
} from "lucide-react";
import { getUserById } from "@/lib/firestore-users";
import { getCareerContext } from "@/lib/api";
import { deterministicJobMatch } from "@/lib/ai/service";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

import { DashboardKpiCards } from "./components/DashboardKpiCards";
import {
  MentorshipScheduleCard,
  type MentorshipSessionItem,
} from "./components/MentorshipScheduleCard";
import {
  RecentApplicationsTable,
  type DashboardApplicationItem,
} from "./components/RecentApplicationsTable";
import { TopJobMatches, type MatchedJobItem } from "./components/TopJobMatches";
import { ProfileReadinessDonut } from "./components/ProfileReadinessDonut";
import { QuickResumeCard } from "./components/QuickResumeCard";

export const dynamic = "force-dynamic";

// Fetch real user applications from Firestore
async function getUserApplications(userId: string): Promise<DashboardApplicationItem[]> {
  if (!hasFirebaseAdminCredentials()) return [];
  try {
    const snap = await getAdminDb()
      .collection("applications")
      .where("userId", "==", userId)
      .limit(10)
      .get();

    return snap.docs
      .map((d) => {
        const data = d.data();
        if (data.isDemo) return null;
        return {
          id: d.id,
          status: data.status || "APPLIED",
          updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
          createdAt: data.createdAt,
          opportunity: {
            id: data.opportunityId || data.opportunity?.id || d.id,
            title: data.title || data.opportunity?.title || "Role Application",
            organizationName: data.organizationName || data.opportunity?.organizationName || "Company",
            type: data.type || data.opportunity?.type || "Full-time",
            location: data.location || data.opportunity?.location || "Remote",
          },
        };
      })
      .filter(Boolean) as DashboardApplicationItem[];
  } catch {
    return [];
  }
}

// Fetch real student booked mentorship requests from Firestore
async function getUserMentorshipSessions(userId: string): Promise<MentorshipSessionItem[]> {
  if (!hasFirebaseAdminCredentials()) return [];
  try {
    const snap = await getAdminDb()
      .collection("mentorship_requests")
      .where("studentId", "==", userId)
      .limit(5)
      .get();

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        mentorName: data.mentorName || "Mentor",
        topic: data.topic || "Career Guidance",
        scheduledDate: data.scheduledDate || "Upcoming",
        scheduledTime: data.scheduledTime || "11:00 AM",
        meetingUrl: data.meetingUrl || "",
        status: data.status || "PENDING",
      };
    });
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?stale=1");

  const roles = session.user.roles ?? ["STUDENT"];
  if (roles.includes("PLATFORM_ADMIN")) redirect("/admin");

  const user = await getUserById(session.user.id).catch(() => null);
  const isHr = roles.includes("HR") || user?.registration?.track === "hr";
  const isMentor = roles.includes("MENTOR") || user?.registration?.track === "mentor";

  // Dedicated role routing
  if (isHr) redirect("/recruiter");
  if (isMentor) redirect("/mentor");

  const firstName = session.user.name?.split(" ")[0] || "there";

  // Fetch Firestore data in parallel
  const [applications, mentorshipSessions, { jobs: liveJobs }, ctx] = await Promise.all([
    getUserApplications(session.user.id),
    getUserMentorshipSessions(session.user.id),
    loadJobsFromFirestore(12),
    getCareerContext(session.user.id).catch(() => null),
  ]);

  const resume = user?.resume || user?.resumes?.[0] || null;
  const analysis = user?.careerAnalysisJson ? JSON.parse(user.careerAnalysisJson) : null;
  const careerScore = analysis?.careerScore ?? user?.careerScore ?? 78;
  const profileCompleteness = user?.profileCompleteness ?? 65;

  // Match live jobs against student's profile context
  const matched: MatchedJobItem[] = liveJobs
    .slice(0, 8)
    .map((job) => ({
      job,
      match: ctx
        ? deterministicJobMatch(ctx, {
            title: job.title,
            description: job.blurb,
            skills: job.tags,
            eligibility: null,
            type: job.type,
          })
        : null,
    }))
    .sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0))
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Launchpad */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Student Career Workspace
            </p>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-600 mt-0.5 max-w-xl">
            Track your job applications, scheduled mentor sessions, and real-time ATS match readiness.
          </p>
        </div>

        {/* 1-Click Launchpad Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/create-resume"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Sparkles size={15} />
            Build ATS Resume
          </Link>
          <Link
            href="/opportunities/browse"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Briefcase size={15} />
            Explore Jobs
          </Link>
          <Link
            href="/mentors"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Users size={15} />
            Find Mentors
          </Link>
        </div>
      </div>

      {/* Top 4 Pastel KPI Stat Cards */}
      <DashboardKpiCards
        careerScore={careerScore}
        applicationsCount={applications.length}
        resumeScore={resume?.analyses?.[0]?.score}
        hasResume={Boolean(resume)}
        mentorshipSessionsCount={mentorshipSessions.length}
      />

      {/* Main Grid: Visual Donut + Upcoming Schedule + Real Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Applications Table + Targeted Matches */}
        <div className="lg:col-span-8 space-y-6">
          {/* Upcoming Mentorship Sessions Card */}
          <MentorshipScheduleCard sessions={mentorshipSessions} />

          {/* Real Applications Table */}
          <RecentApplicationsTable applications={applications} />

          {/* Top Targeted Live Job Matches */}
          <TopJobMatches matched={matched} totalJobsCount={liveJobs.length} />
        </div>

        {/* Right Column (4 cols): Visual Readiness Donut + Resume Status Card */}
        <div className="lg:col-span-4 space-y-6">
          <ProfileReadinessDonut
            profileCompleteness={profileCompleteness}
            hasResume={Boolean(resume)}
            skillsCount={user?.skills?.length || 0}
            hasDegree={Boolean(user?.degree)}
          />

          <QuickResumeCard resumeFileName={resume?.fileName} />
        </div>
      </div>
    </div>
  );
}
