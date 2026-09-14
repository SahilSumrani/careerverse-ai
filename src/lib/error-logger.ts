/**
 * Production Error Logging and Monitoring
 * Supports Sentry HTTP ingest API without peer dependency conflicts on Next.js 16 + React 19.
 */

interface ErrorContext {
  userId?: string;
  route?: string;
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
}

export async function captureException(error: unknown, context?: ErrorContext): Promise<void> {
  const isDev = process.env.NODE_ENV !== "production";
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const payload = {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    ...context,
  };

  if (isDev) {
    console.error("[DEV ERROR LOG]", payload);
  } else {
    console.error("[PROD ERROR LOG]", JSON.stringify(payload));
  }

  // If SENTRY_DSN is configured, dispatch to Sentry Store API
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) {
    try {
      const urlMatch = dsn.match(/https:\/\/([^@]+)@([^/]+)\/(\d+)/);
      if (urlMatch) {
        const [, publicKey, host, projectId] = urlMatch;
        const sentryUrl = `https://${host}/api/${projectId}/store/?sentry_version=7&sentry_key=${publicKey}`;
        await fetch(sentryUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: errorMessage,
            level: "error",
            platform: "javascript",
            timestamp: new Date().toISOString(),
            extra: payload,
          }),
        }).catch(() => {});
      }
    } catch {
      // Fail-silent in production so monitoring never crashes user flows
    }
  }
}
