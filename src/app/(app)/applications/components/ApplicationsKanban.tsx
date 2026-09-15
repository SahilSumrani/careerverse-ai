import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type ApplicationItem,
  type AppStatus,
  statusLabel,
} from "./ApplicationTimeline";

interface ApplicationsKanbanProps {
  byStatus: Record<AppStatus, ApplicationItem[]>;
  onCardClick: (id: string) => void;
}

export function ApplicationsKanban({ byStatus, onCardClick }: ApplicationsKanbanProps) {
  return (
    <div className="cv-apps-shell p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {(["SAVED", "PREPARING", "APPLIED", "INTERVIEW", "OFFER", "HIRED"] as AppStatus[]).map((status, colIndex) => (
          <div
            key={status}
            className="min-w-0"
            style={{ animation: `cv-apps-card-in 480ms cubic-bezier(0.16, 1, 0.3, 1) both`, animationDelay: `${colIndex * 60}ms` }}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground">{statusLabel(status)}</p>
              <Badge>{byStatus[status]?.length ?? 0}</Badge>
            </div>
            <div className="min-h-40 space-y-2 rounded-2xl border border-border bg-white/70 p-2">
              {byStatus[status]?.map((item, index) => (
                <Card
                  key={item.id}
                  className="cv-apps-card cursor-pointer overflow-hidden p-3 shadow-none"
                  style={{ animationDelay: `${index * 40}ms` }}
                  onClick={() => onCardClick(item.id)}
                >
                  <CardHeader className="mb-1">
                    <CardTitle className="text-sm leading-snug">{item.opportunity.title}</CardTitle>
                    <CardDescription className="truncate">
                      {item.opportunity.organizationName || "Organization"}
                      {item.opportunity.isDemo ? " · Demo" : ""}
                    </CardDescription>
                  </CardHeader>
                  {item.matchScore != null ? (
                    <Badge tone="success" className="mb-1">
                      {item.matchScore}% match
                    </Badge>
                  ) : null}
                </Card>
              ))}
              {!byStatus[status]?.length ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">Empty</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
