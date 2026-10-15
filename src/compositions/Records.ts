/**
 * A person's on-time record, visible only to people who have shared a plan with
 * them. The privacy rule lives here so PunctualityTracking stays a plain store.
 */
import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, view, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { recordInput } from "./validators.ts";

const { Identifying, Planning, RSVPing, PunctualityTracking } = concepts;

/** Some event both the viewer and the target responded GOING to. */
const sharesAPlan = view("(viewer) shares a plan with (target)", ({ viewer, target }) =>
  where(RSVPing._sharedEvents({ user: viewer, other: target })),
).holds();

const RecordCard = former(
  "the record card of (target)",
  ({ target }, { name, onTime, total, event, minutesLate, title, startTime }) =>
    where(
      Identifying._name({ user: target }).is({ name }),
      PunctualityTracking._summary({ user: target, limit: 5 }).is({ onTime, total }),
    ).form({
      user: target,
      name,
      onTime,
      total,
      recent: each(PunctualityTracking._recent({ user: target, limit: 5 }).is({ event, minutesLate }))
        .where(Planning._details({ plan: event }).is({ title, startTime }))
        .form({ plan: event, title, startTime, minutesLate }),
    }),
);

const ViewRecord = endpoint(
  "/records/view",
  ({ secret, viewer, target }) =>
    receive({ secret, target })
      .then(Identifying.identify({ secret }).responds({ user: viewer }))
      .then(
        where(sharesAPlan({ viewer, target }))
          .then(respond({ card: RecordCard({ target }) }))
          .named("shared"),
        where(no(RSVPing._sharedEvents({ user: viewer, other: target })))
          .then(respond({ error: "NOT_SHARED" }))
          .named("not-shared"),
      ),
  { input: { required: ["secret", "target"] }, validators: { input: recordInput } },
);

export const composition = {
  Viewing: { ViewRecord, sharesAPlan, RecordCard },
};
