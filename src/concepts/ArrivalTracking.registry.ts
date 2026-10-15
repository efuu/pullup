import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/ArrivalTracking.md" with { type: "text" };
import {
  AlreadyArrived,
  AlreadyLeft,
  ArrivalTrackingConcept,
  InvalidEta,
  NotOnTheWay,
} from "./ArrivalTracking.ts";

export const arrivalTracking = registerConcept({
  class: ArrivalTrackingConcept,
  spec,
  refusals: {
    INVALID_ETA: InvalidEta,
    ALREADY_LEFT: AlreadyLeft,
    NOT_ON_THE_WAY: NotOnTheWay,
    ALREADY_ARRIVED: AlreadyArrived,
  },
});
