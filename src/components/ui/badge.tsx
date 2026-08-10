import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "accent" | "info" | "violet";
}) {
  const tones = {
    default: "bg-muted text-foreground",
    success: "status-applied",
    warning: "status-offer",
    accent: "bg-accent text-accent-foreground",
    info: "status-interview",
    violet: "status-screening",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
