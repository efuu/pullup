/**
 * Runtime input validators. Generated TypeScript constrains compiled callers;
 * these reject the untyped JSON a real request can carry.
 */
import type { EndpointValidator } from "@mit-sdg/sync-engine/boundary";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnly(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function validator(
  accepts: (value: Record<string, unknown>) => boolean,
  detail: string,
): EndpointValidator {
  return (value) => (record(value) && accepts(value) ? { ok: true } : { ok: false, detail });
}

const str = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;

const secret = (value: unknown) => str(value, 128);
const id = (value: unknown) => str(value, 128);
const time = (value: unknown) => str(value, 64) && !Number.isNaN(new Date(value).getTime());

export const nameInput = validator(
  (v) => hasOnly(v, ["name"]) && typeof v.name === "string" && v.name.length <= 40,
  "name must be a string of at most 40 characters",
);

export const secretOnlyInput = validator(
  (v) => hasOnly(v, ["secret"]) && secret(v.secret),
  "secret must be a bounded string",
);

export const createPlanInput = validator(
  (v) =>
    hasOnly(v, ["secret", "title", "place", "startTime", "decideBy"]) &&
    secret(v.secret) &&
    typeof v.title === "string" &&
    v.title.length <= 80 &&
    typeof v.place === "string" &&
    v.place.length <= 80 &&
    time(v.startTime) &&
    time(v.decideBy) &&
    new Date(v.decideBy as string).getTime() <= new Date(v.startTime as string).getTime(),
  "title and place must be bounded strings; startTime and decideBy must be times with decideBy no later than startTime",
);

export const secretPlanInput = validator(
  (v) => hasOnly(v, ["secret", "plan"]) && secret(v.secret) && id(v.plan),
  "secret and plan must be bounded strings",
);

export const respondInput = validator(
  (v) =>
    hasOnly(v, ["secret", "plan", "status"]) &&
    secret(v.secret) &&
    id(v.plan) &&
    (v.status === "GOING" || v.status === "MAYBE" || v.status === "NO"),
  "status must be GOING, MAYBE, or NO",
);

export const leaveInput = validator(
  (v) =>
    hasOnly(v, ["secret", "plan", "etaMinutes"]) &&
    secret(v.secret) &&
    id(v.plan) &&
    typeof v.etaMinutes === "number" &&
    Number.isFinite(v.etaMinutes),
  "etaMinutes must be a number",
);

export const recordInput = validator(
  (v) => hasOnly(v, ["secret", "target"]) && secret(v.secret) && id(v.target),
  "secret and target must be bounded strings",
);
