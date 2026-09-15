import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type FocusedUser = {
  id: string;
  name: string | null;
  email: string;
  roles: string[];
  activity: Array<{ id: string; name: string; createdAt: string | null }>;
};

interface UserInspectionDrawerProps {
  focusedUser: FocusedUser | null;
  onClose: () => void;
}

export function UserInspectionDrawer({ focusedUser, onClose }: UserInspectionDrawerProps) {
  if (!focusedUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs p-4">
      <div className="h-full w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {focusedUser.name || focusedUser.email}
              </h3>
              <p className="text-xs text-slate-500">
                {focusedUser.email} · {focusedUser.roles.join(", ")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Telemetry Events
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {focusedUser.activity.map((ev) => (
                <div key={ev.id} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                  <p className="font-bold text-slate-800">{ev.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {ev.createdAt ? ev.createdAt.slice(0, 19).replace("T", " ") : "Timestamped"}
                  </p>
                </div>
              ))}
              {!focusedUser.activity.length && (
                <p className="text-xs text-slate-400">No logged activity recorded for this profile.</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <Link
            href={`/admin/users/${encodeURIComponent(focusedUser.id)}`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Full User Profile
          </Link>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close Drawer
          </Button>
        </div>
      </div>
    </div>
  );
}
