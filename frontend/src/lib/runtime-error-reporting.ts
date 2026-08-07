export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("NetworkIQ runtime error", {
    message,
    route: window.location.pathname,
    ...context,
    ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
  });
}
