"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-3 px-4">
      <h2 className="font-display text-2xl">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        We hit an unexpected error. You can try again, or return to the dashboard.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
      >
        Try again
      </button>
      {process.env.NODE_ENV === "development" ? (
        <pre className="mt-2 max-w-full overflow-auto rounded-xl bg-muted p-3 text-xs">{error.message}</pre>
      ) : null}
    </div>
  );
}
