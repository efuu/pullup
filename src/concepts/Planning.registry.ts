import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Planning.md" with { type: "text" };
import {
  InvalidDetails,
  NotOrganizer,
  PlanCancelled,
  PlanningConcept,
  StartInPast,
  UnknownPlan,
} from "./Planning.ts";

export const planning = registerConcept({
  class: PlanningConcept,
  spec,
  refusals: {
    INVALID_DETAILS: InvalidDetails,
    START_IN_PAST: StartInPast,
    UNKNOWN_PLAN: UnknownPlan,
    NOT_ORGANIZER: NotOrganizer,
    PLAN_CANCELLED: PlanCancelled,
  },
});
