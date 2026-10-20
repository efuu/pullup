import type { PullUpWireHttp } from "../../generated/wire.ts";

/**
 * A minimal typed client over the generated wire contract: POST JSON to
 * /api/<path>, get back the output or {error}. (The engine's own HTTP client
 * imports Node built-ins, which the browser bundle cannot use.)
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
    if ("error" in body && body.error === "UNAUTHORIZED") {
      // The saved secret no longer identifies anyone (e.g. the database was reset).
      // Let the app forget it and ask for a name again, without losing the page.
      window.dispatchEvent(new Event("pullup:unauthorized"));
    }
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
  me: { claim: bound("/me/claim"), current: bound("/me/current"), rename: bound("/me/rename") },
  plans: {
    create: bound("/plans/create"),
    view: bound("/plans/view"),
    mine: bound("/plans/mine"),
    respond: bound("/plans/respond"),
    reschedule: bound("/plans/reschedule"),
    cancel: bound("/plans/cancel"),
    leave: bound("/plans/leave"),
    eta: bound("/plans/eta"),
    arrive: bound("/plans/arrive"),
  },
  records: { view: bound("/records/view") },
};

const KEY = "pullup.secret";
export function secret(): string {
  try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}
export function rememberSecret(value: string) {
  try { localStorage.setItem(KEY, value); } catch { /* private mode: identity won't survive a reload */ }
}
export function forgetSecret() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** The backend answers with a category; the caller supplies the specific sentence when it knows it. */
export function explain(error: string, context: string = ""): string {
  const generic: Record<string, string> = {
    UNAUTHORIZED: "This browser isn't recognized any more. Enter your name again.",
    NOT_FOUND: "That plan doesn't exist, or the link is wrong.",
    FORBIDDEN: "You're not allowed to do that.",
    CONFLICT: "That can't happen twice.",
    INVALID_REQUEST: "Check what you typed.",
    UNAVAILABLE: "The server isn't reachable right now. Try again in a moment.",
    TIMEOUT: "The server took too long. Try again.",
  };
  if (error === "UNAUTHORIZED" || error === "UNAVAILABLE" || error === "TIMEOUT") return generic[error]!;
  return context || generic[error] || `Something went wrong (${error}).`;
}

export type Status = "GOING" | "MAYBE" | "NO";
export const statusLabel: Record<Status, string> = { GOING: "Going", MAYBE: "Maybe", NO: "Can't" };

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? `today ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
    : d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
export function fmtClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
export function relative(iso: string, now = Date.now()): string {
  const m = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (Math.abs(m) < 1) return "now";
  const abs = Math.abs(m);
  const text = abs < 60 ? `${abs} min` : abs < 48 * 60 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} d`;
  return m > 0 ? `in ${text}` : `${text} ago`;
}
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}
