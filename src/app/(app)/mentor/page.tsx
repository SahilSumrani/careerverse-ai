"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Video,
  Clock,
  Settings,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface MentorshipRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  topic: string;
  notes?: string;
  scheduledDate: string;
  scheduledTime?: string;
  meetingUrl?: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED";
  createdAt: string;
}

interface MentorProfile {
  isAvailable: boolean;
  meetingUrl: string;
  expertise: string;
  availableDays: string;
  hourlySlots: string;
  bio: string;
}

export default function MentorDashboardPage() {
  const { data: session } = useSession();

  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [profile, setProfile] = useState<MentorProfile>({
    isAvailable: true,
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    expertise: "Full Stack Engineering & Career Guidance",
    availableDays: "Mon, Wed, Fri",
    hourlySlots: "10:00 AM - 5:00 PM",
    bio: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load requests and mentor profile from Firestore
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, profRes] = await Promise.all([
        fetch("/api/mentor/requests?role=mentor"),
        fetch("/api/mentor/profile"),
      ]);

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.items || []);
      }

      if (profRes.ok) {
        const profData = await profRes.json();
        if (profData.profile) {
          setProfile((prev) => ({ ...prev, ...profData.profile }));
        }
      }
    } catch (err) {
      console.error("Error loading mentor dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle request decision (Accept / Decline / Complete)
  const handleDecision = async (requestId: string, status: "CONFIRMED" | "DECLINED" | "COMPLETED") => {
    setUpdatingId(requestId);
    try {
      const res = await fetch("/api/mentor/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status,
          meetingUrl: status === "CONFIRMED" ? profile.meetingUrl : undefined,
        }),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status,
                  meetingUrl: status === "CONFIRMED" ? profile.meetingUrl : r.meetingUrl,
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error("Error updating mentorship request:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Save profile settings to Firestore
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/mentor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving mentor profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const confirmedSessions = requests.filter((r) => r.status === "CONFIRMED");
  const completedSessions = requests.filter((r) => r.status === "COMPLETED");

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Approved Mentor Console
            </p>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Mentor Workspace
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage incoming session requests, schedule 1-on-1 mentorship, and share meeting links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              profile.isAvailable
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                profile.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            {profile.isAvailable ? "Accepting Mentees" : "Sessions Paused"}
          </span>
        </div>
      </div>

      {/* Pastel KPI Cards (Matching Dashboard Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Lavender/Purple - Total Mentees */}
        <div className="p-5 rounded-2xl border border-purple-100 bg-linear-to-br from-purple-50/70 to-indigo-50/40 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <Users size={20} />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
              Network
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">
              {confirmedSessions.length + completedSessions.length}
            </h3>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">Total Mentees</p>
          </div>
        </div>

        {/* Card 2: Amber/Peach - Pending Requests */}
        <div className="p-5 rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50/70 to-orange-50/40 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock size={20} />
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
              Action Required
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{pendingRequests.length}</h3>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">Pending Requests</p>
          </div>
        </div>

        {/* Card 3: Sky Blue/Mint - Confirmed Upcoming */}
        <div className="p-5 rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50/70 to-teal-50/40 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
              <Calendar size={20} />
            </div>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md">
              Upcoming
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{confirmedSessions.length}</h3>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">Confirmed Sessions</p>
          </div>
        </div>

        {/* Card 4: Emerald - Completed Sessions */}
        <div className="p-5 rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50/70 to-teal-50/40 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              Delivered
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{completedSessions.length}</h3>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">Completed Sessions</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Queue & Meeting Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Incoming Requests & Active Sessions */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pending Student Booking Requests */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Incoming Mentorship Requests</h2>
                <p className="text-xs text-slate-500">Students seeking guidance and career advice</p>
              </div>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                {pendingRequests.length} pending
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading requests...
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{req.studentName}</span>
                        <span className="text-xs text-slate-500">&bull; {req.studentEmail}</span>
                      </div>
                      <h4 className="text-xs font-bold text-purple-700 mt-1 flex items-center gap-1.5">
                        <Sparkles size={12} /> {req.topic}
                      </h4>
                      {req.notes && (
                        <p className="text-xs text-slate-600 mt-1 bg-white p-2 rounded-lg border border-slate-200/60">
                          &ldquo;{req.notes}&rdquo;
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Clock size={11} /> Requested Date: {req.scheduledDate} ({req.scheduledTime || "11:00 AM"})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDecision(req.id, "CONFIRMED")}
                        disabled={updatingId === req.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {updatingId === req.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Accept & Share Link
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(req.id, "DECLINED")}
                        disabled={updatingId === req.id}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  No pending student mentorship requests at the moment.
                </p>
              </div>
            )}
          </div>

          {/* Confirmed / Active Mentorship Roster */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Mentorship Schedule</h2>
                <p className="text-xs text-slate-500">Upcoming and completed sessions with mentees</p>
              </div>
            </div>

            {confirmedSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-2.5">Mentee</th>
                      <th className="pb-2.5">Topic</th>
                      <th className="pb-2.5">Scheduled Date</th>
                      <th className="pb-2.5">Meeting Link</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {confirmedSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 font-semibold text-slate-900">
                          {session.studentName}
                          <span className="block text-[11px] font-normal text-slate-500">
                            {session.studentEmail}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-slate-700">{session.topic}</td>
                        <td className="py-3 text-slate-600 font-mono text-[11px]">
                          {session.scheduledDate} {session.scheduledTime}
                        </td>
                        <td className="py-3">
                          {session.meetingUrl ? (
                            <a
                              href={session.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              <Video size={13} />
                              Open Meet
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">No link</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDecision(session.id, "COMPLETED")}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-semibold text-[11px] transition-colors"
                          >
                            Mark Completed
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-xs text-slate-500">No active confirmed sessions scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Mentor Availability & Settings Card */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Settings size={16} className="text-purple-600" />
                Mentorship Settings
              </h3>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Saved!
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mentorship Availability
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="availToggle"
                  checked={profile.isAvailable}
                  onChange={(e) => setProfile((p) => ({ ...p, isAvailable: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="availToggle" className="text-xs text-slate-700 cursor-pointer">
                  Accept new mentorship bookings
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Google Meet / Zoom Link
              </label>
              <input
                type="url"
                value={profile.meetingUrl}
                onChange={(e) => setProfile((p) => ({ ...p, meetingUrl: e.target.value }))}
                placeholder="https://meet.google.com/..."
                className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-500 bg-slate-50 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                This link will automatically be sent to students upon accepting a session.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mentoring Topics & Expertise
              </label>
              <input
                type="text"
                value={profile.expertise}
                onChange={(e) => setProfile((p) => ({ ...p, expertise: e.target.value }))}
                placeholder="e.g. System Design, Resume Reviews, Frontend"
                className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Available Days</label>
                <input
                  type="text"
                  value={profile.availableDays}
                  onChange={(e) => setProfile((p) => ({ ...p, availableDays: e.target.value }))}
                  placeholder="Mon, Wed, Fri"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-500 bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hours / Window</label>
                <input
                  type="text"
                  value={profile.hourlySlots}
                  onChange={(e) => setProfile((p) => ({ ...p, hourlySlots: e.target.value }))}
                  placeholder="10 AM - 4 PM"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Mentor Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
