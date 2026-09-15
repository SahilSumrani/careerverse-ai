import Link from "next/link";
import { ClipboardList } from "lucide-react";

export interface DashboardApplicationItem {
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

interface RecentApplicationsTableProps {
  applications: DashboardApplicationItem[];
}

export function getStatusBadge(status: string) {
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
}

export function RecentApplicationsTable({ applications }: RecentApplicationsTableProps) {
  return (
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
  );
}
