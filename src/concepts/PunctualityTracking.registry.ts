import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/PunctualityTracking.md" with { type: "text" };
import { AlreadyRecorded, PunctualityTrackingConcept } from "./PunctualityTracking.ts";

export const punctualityTracking = registerConcept({
  class: PunctualityTrackingConcept,
  spec,
  refusals: { ALREADY_RECORDED: AlreadyRecorded },
});
