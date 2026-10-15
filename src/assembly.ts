import { assemble } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";
import { composition as identity } from "./compositions/Identity.ts";
import { composition as plans } from "./compositions/Plans.ts";
import { composition as records } from "./compositions/Records.ts";
import { ArrivalTrackingConcept } from "./concepts/ArrivalTracking.ts";
import { IdentifyingConcept } from "./concepts/Identifying.ts";
import { PlanningConcept } from "./concepts/Planning.ts";
import { PunctualityTrackingConcept } from "./concepts/PunctualityTracking.ts";
import { RSVPingConcept } from "./concepts/RSVPing.ts";
import { applicationConceptSet } from "./concepts.ts";
import { db as defaultDb } from "./db.ts";

export function assembleApplication(db: Db = defaultDb) {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: {
      Identifying: new IdentifyingConcept(db),
      Planning: new PlanningConcept(db),
      RSVPing: new RSVPingConcept(db),
      ArrivalTracking: new ArrivalTrackingConcept(db),
      PunctualityTracking: new PunctualityTrackingConcept(db),
    },
    composition: { Identity: identity, Plans: plans, Records: records },
    // Print what went wrong. Otherwise a failure only shows up as INTERNAL_ERROR.
    rawFaultReporter: ({ error }) => console.error(error),
  });
}
