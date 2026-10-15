import { conceptSet } from "@mit-sdg/sync-engine/assembly";
import { arrivalTracking } from "./concepts/ArrivalTracking.registry.ts";
import { identifying } from "./concepts/Identifying.registry.ts";
import { planning } from "./concepts/Planning.registry.ts";
import { punctualityTracking } from "./concepts/PunctualityTracking.registry.ts";
import { rsvping } from "./concepts/RSVPing.registry.ts";

export const applicationConceptSet = conceptSet({
  Identifying: identifying,
  Planning: planning,
  RSVPing: rsvping,
  ArrivalTracking: arrivalTracking,
  PunctualityTracking: punctualityTracking,
});

export const { concepts } = applicationConceptSet;
