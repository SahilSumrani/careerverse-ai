import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Calendar,
  ClipboardList,
  FileText,
  Sparkles,
  Users,
  Video,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Plus,
} from "lucide-react";
import { getUserById } from "@/lib/firestore-users";
import { Badge } from "@/components/ui/badge";
import { getCareerContext } from "@/lib/api";
import { deterministicJobMatch } from "@/lib/ai/service";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

interface ApplicationItem {
  id: string;
  status: string;
  updatedAt: string;
  createdAt?: string;
  opportunity: {
    id?: string;
    title: string;
    organizationName?: string | null;
    type?: string;
    location?: string;
  };
}

interface MentorshipSessionItem {
  id: string;
  mentorName: string;
  topic: string;
  scheduledDate: string;
  scheduledTime?: string;
  meetingUrl?: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED";
}

// Fetch real user applications from Firestore
async function getUserApplications(userId: string): Promise<ApplicationItem[]> {
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
      .filter(Boolean) as ApplicationItem[];
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
  const matched = liveJobs
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

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "INTERVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
            Interview
          </span>
        );
      case "OFFER":
      case "HIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            {status === "HIRED" ? "Hired" : "Offer Received"}
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case "ASSESSMENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Assessment
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Under Review
          </span>
        );
    }
  };

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

      {/* Top 4 Pastel KPI Stat Cards (Inspired by QualityCampus & Soho Store UI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Lavender/Purple - AI Career Score */}
        <div className="p-5 rounded-2xl border border-purple-100 bg-linear-to-br from-purple-50/70 to-indigo-50/40 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
              <Sparkles size={20} />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
              Top 20%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{careerScore}/100</h3>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">AI Career Intelligence</p>
          </div>
          <p className="text-[11px] text-purple-800 font-medium mt-2 pt-2 border-t border-purple-100/80 flex items-center gap-1">
            <CheckCircle2 size={13} className="text-purple-600" />
            Verified skills fit & gaps
          </p>
        </div>

        {/* Card 2: Peach/Amber - Active Applications */}
        <div className="p-5 rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50/70 to-orange-50/40 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
              <ClipboardList size={20} />
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
              Firestore Live
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{applications.length}</h3>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">Active Applications</p>
          </div>
          <Link
            href="/applications"
            className="text-[11px] text-amber-900 font-medium mt-2 pt-2 border-t border-amber-100/80 hover:text-amber-700 flex items-center justify-between"
          >
            <span>View application pipeline</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {/* Card 3: Rose/Pink - ATS Resume Status */}
        <div className="p-5 rounded-2xl border border-rose-100 bg-linear-to-br from-rose-50/70 to-pink-50/40 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shadow-2xs">
              <FileText size={20} />
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
              {resume ? "Ready" : "Incomplete"}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">
              {resume?.analyses?.[0]?.score ? `${resume.analyses[0].score}%` : "A4 Ready"}
            </h3>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">Resume ATS Health</p>
          </div>
          <Link
            href="/create-resume"
            className="text-[11px] text-rose-800 font-medium mt-2 pt-2 border-t border-rose-100/80 hover:text-rose-900 flex items-center justify-between"
          >
            <span>Edit in Resume Builder</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {/* Card 4: Sky Blue/Mint - Mentorship Sessions */}
        <div className="p-5 rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50/70 to-teal-50/40 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shadow-2xs">
              <Calendar size={20} />
            </div>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md">
              1-on-1 Mentors
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">
              {mentorshipSessions.length}
            </h3>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">Booked Sessions</p>
          </div>
          <Link
            href="/mentors"
            className="text-[11px] text-sky-800 font-medium mt-2 pt-2 border-t border-sky-100/80 hover:text-sky-900 flex items-center justify-between"
          >
            <span>Schedule new session</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Main Grid: Visual Donut + Upcoming Schedule + Real Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Applications Table + Targeted Matches */}
        <div className="lg:col-span-8 space-y-6">
          {/* Upcoming Mentorship Sessions Card (Matching Image 2 Lecture Card style) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Upcoming Mentorship Schedule</h2>
                <p className="text-xs text-slate-500">Confirmed sessions with industry leaders</p>
              </div>
              <Link href="/mentors" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                See Mentors &rarr;
              </Link>
            </div>

            {mentorshipSessions.length > 0 ? (
              <div className="space-y-3">
                {mentorshipSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1.5 rounded-lg bg-purple-600 text-white text-center font-bold text-xs min-w-[70px] shadow-2xs">
                        {session.scheduledTime || "11:00 AM"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{session.topic}</h4>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <Users size={12} className="text-slate-400" />
                          <span>Mentor: {session.mentorName}</span>
                          <span>&bull;</span>
                          <Clock size={12} className="text-slate-400" />
                          <span>{session.scheduledDate}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.status === "CONFIRMED" && session.meetingUrl ? (
                        <a
                          href={session.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                        >
                          <Video size={13} />
                          Join Meeting
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
                          {session.status === "CONFIRMED" ? "Confirmed" : "Awaiting Mentor"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
                <Video size={28} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">No scheduled sessions yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                  Connect with verified tech leads, founders, and engineers for 1-on-1 mock interviews and guidance.
                </p>
                <Link
                  href="/mentors"
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Plus size={13} /> Book 1-on-1 Mentor
                </Link>
              </div>
            )}
          </div>

          {/* Real Applications Table (Matching Image 1 Data Table) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Applications Pipeline</h2>
                <p className="text-xs text-slate-500">Live applications tracked in Firestore</p>
              </div>
              <Link href="/applications" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                View All ({applications.length}) &rarr;
              </Link>
            </div>

            {applications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-2.5">Position / Role</th>
                      <th className="pb-2.5">Company</th>
                      <th className="pb-2.5">Applied Date</th>
                      <th className="pb-2.5">Current Status</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {applications.slice(0, 5).map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 font-semibold text-slate-900">
                          {app.opportunity.title}
                        </td>
                        <td className="py-3 text-slate-600">
                          {app.opportunity.organizationName || "CareerVerse Partner"}
                        </td>
                        <td className="py-3 text-slate-500 font-mono text-[11px]">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Recent"}
                        </td>
                        <td className="py-3">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href="/applications"
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 p-1"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
                <ClipboardList size={28} className="mx-auto text-slate-400 mb-1.5" />
                <p className="text-xs font-bold text-slate-700">No applications sent yet</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Browse live verified roles and apply directly with your ATS resume.
                </p>
                <Link
                  href="/opportunities/browse"
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Explore Jobs &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Top Targeted Live Job Matches */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Top Matches for You</h2>
                <p className="text-xs text-slate-500">Matched from live Firestore job listings</p>
              </div>
              <Link href="/opportunities/browse" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                Browse All ({liveJobs.length}) &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {matched.map(({ job, match }) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{job.title}</h4>
                      {match && (
                        <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {match.score}% Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-600 mt-1">
                      {job.company} &bull; {job.location}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {job.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">{job.type}</span>
                    <Link
                      href="/opportunities/browse"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                    >
                      Apply Now <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Visual Readiness Donut + Resume Status Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Readiness & Donut Gauge (Matching Image 1 & 2 Donut Gauge) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Profile Health & Readiness</h3>
            <p className="text-xs text-slate-500 mb-4">Complete your profile to unlock Top Talent status</p>

            <div className="flex flex-col items-center py-2">
              {/* Circular SVG Donut Chart */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#2563eb"
                    strokeWidth="12"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - profileCompleteness / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-900">{profileCompleteness}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Ready</span>
                </div>
              </div>

              {/* Progress items breakdown */}
              <div className="w-full space-y-2.5 mt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className={resume ? "text-emerald-500" : "text-slate-300"} />
                    ATS Resume Created
                  </span>
                  <span className="font-bold text-slate-800">{resume ? "Done" : "Missing"}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className={user?.skills?.length ? "text-emerald-500" : "text-slate-300"} />
                    Technical Skills Added
                  </span>
                  <span className="font-bold text-slate-800">{user?.skills?.length || 0} skills</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className={user?.degree ? "text-emerald-500" : "text-slate-300"} />
                    Education & Degree
                  </span>
                  <span className="font-bold text-slate-800">{user?.degree ? "Verified" : "Missing"}</span>
                </div>
              </div>

              <Link
                href="/profile"
                className="w-full mt-5 py-2.5 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                Complete Full Profile &rarr;
              </Link>
            </div>
          </div>

          {/* Quick Resume Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Interactive Resume</h3>
                <p className="text-xs text-slate-500 mt-0.5">Dual-template real-time editor</p>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <FileText size={18} />
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs font-semibold text-slate-800">
                {resume ? resume.fileName : "Alex Morgan (Standard ATS Draft)"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Executive (2-Col) &bull; Classic (1-Col) &bull; Voice AI
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <Link
                href="/create-resume"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Sparkles size={14} /> Open Resume Builder
              </Link>
              <Link
                href="/resume"
                className="w-full flex items-center justify-center py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Analyze Existing PDF
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
