import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const message = error instanceof Error ? error.message : String(error);
  const digest = typeof error === "object" && error !== null && "digest" in error
    ? String(error.digest)
    : undefined;

  console.error(JSON.stringify({
    event: "green_days_request_error",
    message,
    digest,
    method: request.method,
    path: request.path.split("?")[0],
    route: context.routePath,
    routeType: context.routeType,
    occurredAt: new Date().toISOString(),
  }));
};

