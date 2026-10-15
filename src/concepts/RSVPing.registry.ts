import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/RSVPing.md" with { type: "text" };
import { AlreadyOpen, MaybeClosed, NotOpen, RSVPingConcept } from "./RSVPing.ts";

export const rsvping = registerConcept({
  class: RSVPingConcept,
  spec,
  refusals: { ALREADY_OPEN: AlreadyOpen, NOT_OPEN: NotOpen, MAYBE_CLOSED: MaybeClosed },
});
