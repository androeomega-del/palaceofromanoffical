/**
 * Hydration-mismatch monitor.
 *
 * Patches `console.error` on the client to intercept React's hydration warning
 * family (text/attribute mismatches, "Hydration failed", "did not match",
 * etc.). Each detection is stamped with an ISO timestamp, the offending
 * component name (parsed from the warning + React component-stack), the page
 * pathname, and a short stack tail — then forwarded to:
 *
 *   1. The browser console as `[hydration-mismatch] …` so it shows up in
 *      dev preview logs.
 *   2. `window.__hydrationMismatches` — an in-memory ring buffer of the last
 *      50 events for inspection during a session.
 *
 * The original `console.error` is always called afterwards so React's own
 * warning is preserved verbatim.
 *
 * Install once on the client (module-side-effect) from the root layout.
 */

type HydrationEvent = {
  timestamp: string;
  component: string | null;
  pathname: string | null;
  message: string;
  stackTail: string | null;
};

declare global {
  interface Window {
    __hydrationMismatches?: HydrationEvent[];
    __hydrationMonitorInstalled?: boolean;
  }
}

const HYDRATION_PATTERNS = [
  /hydration failed/i,
  /did not match/i,
  /text content does not match/i,
  /hydrating/i,
  /server rendered html/i,
  /server-rendered html/i,
  /mismatched/i,
  /minified react error #(418|419|421|422|423|425)/i,
];

const MAX_EVENTS = 50;

function formatArg(arg: unknown): string {
  if (arg instanceof Error) return arg.message;
  if (typeof arg === "string") return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function extractComponent(message: string, args: unknown[]): string | null {
  // React often passes the component stack as the last string arg.
  const stackArg = args
    .map(formatArg)
    .reverse()
    .find((s) => /\n\s+at \w/.test(s) || /\n\s+in \w/.test(s));
  if (stackArg) {
    const m =
      stackArg.match(/\n\s+(?:at|in)\s+([A-Z][\w.$]*)/) ??
      stackArg.match(/\n\s+(?:at|in)\s+(\w+)/);
    if (m) return m[1];
  }
  // Fallback: look for "in <ComponentName>" inside the warning text.
  const inMatch = message.match(/in\s+<?([A-Z][\w.$]*)>?/);
  return inMatch ? inMatch[1] : null;
}

function isHydrationWarning(message: string): boolean {
  return HYDRATION_PATTERNS.some((re) => re.test(message));
}

export function installHydrationMonitor(): void {
  if (typeof window === "undefined") return;
  if (window.__hydrationMonitorInstalled) return;
  window.__hydrationMonitorInstalled = true;
  window.__hydrationMismatches = [];

  const originalError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    try {
      const joined = args.map(formatArg).join(" ");
      if (isHydrationWarning(joined)) {
        const event: HydrationEvent = {
          timestamp: new Date().toISOString(),
          component: extractComponent(joined, args),
          pathname: window.location?.pathname ?? null,
          message: joined.slice(0, 500),
          stackTail: new Error().stack?.split("\n").slice(2, 6).join("\n") ?? null,
        };
        const buf = window.__hydrationMismatches!;
        buf.push(event);
        if (buf.length > MAX_EVENTS) buf.shift();
        originalError(
          `[hydration-mismatch] ${event.timestamp} component=${event.component ?? "unknown"} path=${event.pathname}`,
          event,
        );
      }
    } catch {
      // Never let the monitor itself swallow the original warning.
    }
    originalError(...args);
  };
}
