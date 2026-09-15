import { Cpu } from "lucide-react";

export type AiUsageEvent = {
  id: string;
  operation: string;
  model: string | null;
  tokensIn: number;
  tokensOut: number;
  success: boolean;
  userId: string | null;
  createdAt: string | null;
};

interface AiOperationLogsProps {
  logs: AiUsageEvent[];
}

export function AiOperationLogs({ logs }: AiOperationLogsProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">AI Operation Logs</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
          Live
        </span>
      </div>

      <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto">
        {logs.slice(0, 6).map((ev) => (
          <div
            key={ev.id}
            className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{ev.operation}</span>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                  ev.success ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}
              >
                {ev.success ? "OK" : "ERR"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Model: {ev.model || "Gemini"} · In: {ev.tokensIn} / Out: {ev.tokensOut}
            </p>
          </div>
        ))}
        {!logs.length && (
          <p className="py-4 text-center text-xs text-slate-400">No recent AI telemetry.</p>
        )}
      </div>
    </div>
  );
}
