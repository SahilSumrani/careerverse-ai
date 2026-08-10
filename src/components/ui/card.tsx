import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("surface rounded-[20px] p-5", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[15px] font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] p-4 shadow-sm",
        highlight ? "bg-primary text-primary-foreground" : "surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-xs font-medium", highlight ? "text-white/75" : "text-muted-foreground")}>{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? (
            <p className={cn("mt-1 text-xs", highlight ? "text-white/70" : "text-muted-foreground")}>{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              highlight ? "bg-white/15" : "bg-accent text-primary",
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
