import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Identifying.md" with { type: "text" };
import { IdentifyingConcept, InvalidName, UnknownSecret, UnknownUser } from "./Identifying.ts";

export const identifying = registerConcept({
  class: IdentifyingConcept,
  spec,
  refusals: { INVALID_NAME: InvalidName, UNKNOWN_SECRET: UnknownSecret, UNKNOWN_USER: UnknownUser },
});
