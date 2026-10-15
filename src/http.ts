import { httpPolicy } from "@mit-sdg/sync-engine-http/policy";

export const policy = httpPolicy({
  basePath: "/api",
  publicErrors: {
    INVALID_NAME: "INVALID_REQUEST",
    INVALID_DETAILS: "INVALID_REQUEST",
    START_IN_PAST: "INVALID_REQUEST",
    INVALID_ETA: "INVALID_REQUEST",
    UNKNOWN_SECRET: "UNAUTHORIZED",
    UNKNOWN_USER: "NOT_FOUND",
    UNKNOWN_PLAN: "NOT_FOUND",
    NOT_OPEN: "NOT_FOUND",
    NOT_ORGANIZER: "FORBIDDEN",
    PLAN_CANCELLED: "CONFLICT",
    ALREADY_OPEN: "CONFLICT",
    MAYBE_CLOSED: "CONFLICT",
    ALREADY_LEFT: "CONFLICT",
    NOT_ON_THE_WAY: "CONFLICT",
    ALREADY_ARRIVED: "CONFLICT",
    ALREADY_RECORDED: "CONFLICT",
    // Authored by the records endpoint, not a concept refusal; unmapped errors stay private.
    NOT_SHARED: "FORBIDDEN",
  },
});
