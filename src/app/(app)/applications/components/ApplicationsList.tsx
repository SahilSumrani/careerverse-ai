import { CheckCircle2, Clock3, MapPin, Sparkles, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type ApplicationItem,
  type AppStatus,
  statusLabel,
} from "./ApplicationTimeline";

export function companyInitials(name?: string | null): string {
  if (!name) return "CV";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function statusMeta(status: AppStatus) {
  if (status === "HIRED") {
    return { tone: "accent" as const, icon: CheckCircle2, className: "text-emerald-700" };
  }
  if (status === "OFFER") {
    return { tone: "accent" as const, icon: Sparkles, className: "text-emerald-700" };
  }
  if (status === "INTERVIEW" || status === "ASSESSMENT") {
    return { tone: "info" as const, icon: Clock3, className: "text-sky-700" };
  }
  if (status === "APPLIED") {
    return { tone: "success" as const, icon: CheckCircle2, className: "text-emerald-700" };
  }
  if (status === "REJECTED" || status === "WITHDRAWN") {
    return { tone: "warning" as const, icon: XCircle, className: "text-amber-700" };
  }
  if (status === "PREPARING") {
    return { tone: "violet" as const, icon: Clock3, className: "text-violet-700" };
  }
  return { tone: "default" as const, icon: MapPin, className: "text-muted-foreground" };
}

interface ApplicationsListProps {
  filtered: ApplicationItem[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
}

export function ApplicationsList({ filtered, selectedId, onSelectId }: ApplicationsListProps) {
  return (
    <div className="max-h-[70vh] space-y-3 overflow-y-auto border-b border-border p-4 lg:border-b-0 lg:border-r">
      {!filtered.length ? (
        <p className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-10 text-center text-sm text-muted-foreground">
          No applications match these filters.
        </p>
      ) : (
        filtered.map((item, index) => {
          const active = selectedId === item.id;
          const org = item.opportunity.organizationName || "Organization";
          const meta = statusMeta(item.status);
          const StatusIcon = meta.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectId(item.id)}
              className="cv-apps-card w-full p-4 text-left"
              data-active={active}
              style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-[#f2f4f7] text-xs font-bold text-foreground">
                  {companyInitials(org)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-foreground">
                    {item.opportunity.title}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{org}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Badge>{item.opportunity.type}</Badge>
                    {item.matchScore != null ? <Badge tone="info">{item.matchScore}% match</Badge> : null}
                    {(item.opportunity.isDemo || item.isDemo) && <Badge tone="warning">Demo</Badge>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", meta.className)}>
                      <span className="cv-apps-status-dot" />
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusLabel(item.status)}
                    </span>
                    <span className="text-[11px] font-medium text-primary transition group-hover:underline">
                      View details
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
