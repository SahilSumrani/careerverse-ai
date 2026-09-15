import Link from "next/link";
import { Users, Clock, Video, Plus } from "lucide-react";

export interface MentorshipSessionItem {
  id: string;
  mentorName: string;
  topic: string;
  scheduledDate: string;
  scheduledTime?: string;
  meetingUrl?: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED";
}

interface MentorshipScheduleCardProps {
  sessions: MentorshipSessionItem[];
}

export function MentorshipScheduleCard({ sessions }: MentorshipScheduleCardProps) {
  return (
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

      {sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => (
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
  );
}
