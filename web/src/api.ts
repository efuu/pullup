import type { PullUpWireHttp } from "../../generated/wire.ts";

/**
 * A minimal typed client over the generated wire contract. The engine's own
 * HTTP client pulls Node built-ins into the browser bundle, so this does the
 * same thing in 20 lines: POST JSON to /api/<path>, get back output or {error}.
 */
type Wire = PullUpWireHttp;
type Path = keyof Wire & string;
type Output<P extends Path> = Wire[P]["output"] | { error: string };

async function call<P extends Path>(path: P, input: Wire[P]["input"]): Promise<Output<P>> {
  try {
    const response = await fetch(`/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
    });
    const body = (await response.json()) as Output<P>;
    return body;
  } catch {
    return { error: "UNAVAILABLE" };
  }
}

const bound =
  <P extends Path>(path: P) =>
  (input: Wire[P]["input"]) =>
    call(path, input);

export const client = {
  me: { claim: bound("/me/claim"), current: bound("/me/current") },
  plans: {
    create: bound("/plans/create"),
    view: bound("/plans/view"),
    mine: bound("/plans/mine"),
    respond: bound("/plans/respond"),
    cancel: bound("/plans/cancel"),
    leave: bound("/plans/leave"),
    arrive: bound("/plans/arrive"),
  },
  records: { view: bound("/records/view") },
};

const KEY = "pullup.secret";

/** The browser's secret from Identifying.claim; it is the whole identity. */
export function secret(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
export function rememberSecret(value: string) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* private mode: the session simply won't survive a reload */
  }
}
export function forgetSecret() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Turn the backend's error codes and HTTP categories into sentences. */
export function explain(error: string, context: string = ""): string {
  // The backend answers with a category (the exact refusal stays private), so
  // the page that made the call supplies the specific sentence when it knows it.
  const generic: Record<string, string> = {
    UNAUTHORIZED: "This browser isn't recognized any more. Enter your name again.",
    NOT_FOUND: "That plan doesn't exist (or the link is wrong).",
    FORBIDDEN: "You're not allowed to do that.",
    CONFLICT: "That can't happen twice.",
    INVALID_REQUEST: "Check what you typed.",
    UNAVAILABLE: "The server isn't reachable right now.",
    TIMEOUT: "The server took too long. Try again.",
  };
  if (error === "UNAUTHORIZED" || error === "UNAVAILABLE" || error === "TIMEOUT") return generic[error]!;
  return context || generic[error] || `Something went wrong (${error}).`;
}

export type Status = "GOING" | "MAYBE" | "NO";
export const statusLabel: Record<Status, string> = { GOING: "Going", MAYBE: "Maybe", NO: "Can't" };

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
export function fmtClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
/** `datetime-local` wants local time without zone; ISO wants UTC. */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}
