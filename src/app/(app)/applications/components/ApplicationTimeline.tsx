import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const STATUSES = [
  "SAVED",
  "PREPARING",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type AppStatus = (typeof STATUSES)[number];

export const TIMELINE: Array<{ key: AppStatus; label: string; hint: string }> = [
  { key: "SAVED", label: "Saved", hint: "Bookmarked" },
  { key: "PREPARING", label: "Prep", hint: "Getting ready" },
  { key: "APPLIED", label: "Applied", hint: "Submitted" },
  { key: "INTERVIEW", label: "Interview", hint: "In progress" },
  { key: "OFFER", label: "Offer", hint: "Decision" },
  { key: "HIRED", label: "Hired", hint: "Recruiter" },
];

export const TERMINAL: AppStatus[] = ["REJECTED", "WITHDRAWN"];

export type ApplicationItem = {
  id: string;
  status: AppStatus;
  notes?: string | null;
  nextAction?: string | null;
  matchScore?: number | null;
  updatedAt: string;
  createdAt?: string;
  opportunity: {
    id: string;
    title: string;
    organizationName?: string | null;
    type: string;
    isDemo?: boolean;
  };
  isDemo?: boolean;
};

export function statusIndex(status: AppStatus): number {
  if (status === "SAVED") return 0;
  if (status === "PREPARING") return 1;
  if (status === "APPLIED" || status === "ASSESSMENT") return 2;
  if (status === "INTERVIEW") return 3;
  if (status === "OFFER") return 4;
  if (status === "HIRED") return 5;
  if (status === "REJECTED" || status === "WITHDRAWN") return 3;
  return 0;
}

export function statusLabel(status: AppStatus): string {
  if (status === "ASSESSMENT") return "Under review";
  if (status === "APPLIED") return "Applied";
  if (status === "INTERVIEW") return "Interview";
  if (status === "OFFER") return "Offer";
  if (status === "HIRED") return "Hired";
  if (status === "WITHDRAWN") return "Withdrawn";
  if (status === "REJECTED") return "Closed";
  if (status === "SAVED") return "Saved";
  return status;
}

interface ApplicationTimelineProps {
  item: ApplicationItem;
  updating: boolean;
  onUpdate: (status: AppStatus) => void;
}

export function ApplicationTimeline({ item, updating, onUpdate }: ApplicationTimelineProps) {
  const current = statusIndex(item.status);
  const isTerminal = TERMINAL.includes(item.status);
  const isHired = item.status === "HIRED";

  return (
    <div>
      <ol className="relative grid grid-cols-6 gap-1">
        {TIMELINE.map((stage, index) => {
          const done = !isTerminal && index < current;
          const active = !isTerminal && index === current;
          const future = !isTerminal && index > current;
          return (
            <li key={stage.key} className="relative flex flex-col items-center text-center">
              {index < TIMELINE.length - 1 ? (
                <span
                  className={cn(
                    "cv-apps-step-line absolute left-[calc(50%+14px)] top-[13px] h-0.5 w-[calc(100%-28px)]",
                    done || active ? "bg-emerald-500" : "bg-border",
                  )}
                  style={{ animationDelay: `${index * 80}ms` }}
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                disabled={updating || isHired || stage.key === "HIRED"}
                onClick={() => onUpdate(stage.key)}
                className="relative z-[1] flex flex-col items-center gap-1.5 disabled:opacity-60"
              >
                <span
                  className={cn(
                    "cv-apps-step-dot flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition duration-200",
                    active && "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.18)]",
                    done && "border-emerald-500 bg-emerald-500 text-white",
                    future && "border-border bg-white text-muted-foreground",
                    isTerminal && index === current && "border-amber-500 bg-amber-500 text-white",
                  )}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {done || active ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold leading-tight sm:text-xs",
                    active ? "text-emerald-700" : "text-muted-foreground",
                  )}
                >
                  {stage.label}
                </span>
                {active ? (
                  <span className="hidden text-[10px] text-muted-foreground sm:block">{stage.hint}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap gap-2">
        {isHired ? (
          <Badge tone="success">Hired</Badge>
        ) : isTerminal ? (
          <>
            <Badge tone="warning">{statusLabel(item.status)}</Badge>
            <Button size="sm" variant="outline" disabled={updating} onClick={() => onUpdate("SAVED")}>
              Reset to Saved
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" disabled={updating} onClick={() => onUpdate("REJECTED")}>
              Mark rejected
            </Button>
            <Button size="sm" variant="outline" disabled={updating} onClick={() => onUpdate("WITHDRAWN")}>
              Withdraw
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
