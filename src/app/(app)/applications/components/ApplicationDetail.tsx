import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type ApplicationItem,
  type AppStatus,
  ApplicationTimeline,
  statusLabel,
} from "./ApplicationTimeline";
import { companyInitials, statusMeta } from "./ApplicationsList";

export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

interface ApplicationDetailProps {
  selected: ApplicationItem | null;
  updatingId: string | null;
  onUpdateStatus: (id: string, status: AppStatus) => void;
}

export function ApplicationDetail({ selected, updatingId, onUpdateStatus }: ApplicationDetailProps) {
  return (
    <div className="p-4">
      {selected ? (
        <div key={selected.id} className="cv-apps-detail p-5 lg:sticky lg:top-20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-[#f2f4f7] text-sm font-bold">
                {companyInitials(selected.opportunity.organizationName)}
              </div>
              <h2 className="font-display text-2xl tracking-tight">{selected.opportunity.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.opportunity.organizationName || "Organization"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/opportunities/${selected.opportunity.id}`}>
                <Button size="sm" variant="outline" className="rounded-xl">
                  View role
                </Button>
              </Link>
              <Badge tone={statusMeta(selected.status).tone} className="rounded-xl px-3 py-1.5 text-xs">
                {statusLabel(selected.status)}
              </Badge>
            </div>
          </div>

          {selected.matchScore != null ? (
            <div className="mt-4">
              <span className="cv-apps-match">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {selected.matchScore}% matched with your skills
              </span>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge>{selected.opportunity.type}</Badge>
            {(selected.opportunity.isDemo || selected.isDemo) && <Badge tone="warning">Demo</Badge>}
            {formatDate(selected.createdAt) ? (
              <Badge tone="default">Tracked {formatDate(selected.createdAt)}</Badge>
            ) : null}
          </div>

          {selected.nextAction ? (
            <p className="mt-4 rounded-xl border border-border bg-[#f9fafb] px-3.5 py-3 text-sm text-foreground">
              <span className="font-semibold text-primary">Next step:</span> {selected.nextAction}
            </p>
          ) : null}

          <div className="mt-5 rounded-2xl border border-border bg-[#f9fafb] p-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Application progress
            </p>
            <ApplicationTimeline
              item={selected}
              updating={updatingId === selected.id}
              onUpdate={(status) => onUpdateStatus(selected.id, status)}
            />
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-16 text-center text-sm text-muted-foreground">
          Select an application to see details.
        </p>
      )}
    </div>
  );
}
