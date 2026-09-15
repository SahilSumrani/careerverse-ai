import { Filter, RotateCcw } from "lucide-react";
import { type AppStatus, statusLabel } from "./ApplicationTimeline";

export const FILTER_STATUSES: AppStatus[] = [
  "SAVED",
  "PREPARING",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

interface ApplicationsFiltersProps {
  statusFilters: AppStatus[];
  toggleStatus: (status: AppStatus) => void;
  typeOptions: string[];
  typeFilters: string[];
  toggleType: (type: string) => void;
  highMatchOnly: boolean;
  setHighMatchOnly: React.Dispatch<React.SetStateAction<boolean>>;
  resetFilters: () => void;
}

export function ApplicationsFilters({
  statusFilters,
  toggleStatus,
  typeOptions,
  typeFilters,
  toggleType,
  highMatchOnly,
  setHighMatchOnly,
  resetFilters,
}: ApplicationsFiltersProps) {
  return (
    <aside className="border-b border-border p-4 lg:border-b-0 lg:border-r">
      <div className="mb-4 flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          Filter
        </p>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Status
          </p>
          <div className="space-y-2">
            {FILTER_STATUSES.map((status) => (
              <label key={status} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={statusFilters.includes(status)}
                  onChange={() => toggleStatus(status)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary"
                />
                <span>{statusLabel(status)}</span>
              </label>
            ))}
          </div>
        </div>

        {typeOptions.length ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Job type
            </p>
            <div className="space-y-2">
              {typeOptions.map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={typeFilters.includes(type)}
                    onChange={() => toggleType(type)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Match
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={highMatchOnly}
              onChange={() => setHighMatchOnly((v) => !v)}
              className="h-4 w-4 rounded border-border text-primary accent-primary"
            />
            <span>70%+ match only</span>
          </label>
        </div>
      </div>
    </aside>
  );
}
