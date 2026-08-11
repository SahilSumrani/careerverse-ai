"use client";

import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-start justify-center gap-3">
      <p className="text-sm font-medium text-primary">CareerVerse AI</p>
      <h2 className="font-display text-2xl tracking-tight">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        This view hit an unexpected error. Your sidebar is still here — try again or go back to Overview.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold"
        >
          Overview
        </Link>
      </div>
      {process.env.NODE_ENV === "development" ? (
        <pre className="mt-2 max-w-full overflow-auto rounded-xl bg-muted p-3 text-xs">{error.message}</pre>
      ) : null}
    </div>
  );
}
