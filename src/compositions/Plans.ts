/**
 * The plan page: creating, viewing, responding, cancelling, and the day-of
 * pulling-up / pulled-up board. Every endpoint resolves the secret to a user
 * first, so a request can never act as someone else.
 */
import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, form, former, now, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import {
  createPlanInput,
  leaveInput,
  respondInput,
  secretOnlyInput,
  secretPlanInput,
} from "./validators.ts";

const { Identifying, Planning, RSVPing, ArrivalTracking, PunctualityTracking } = concepts;

// ---------------------------------------------------------------- Creating

const CreatePlan = endpoint(
  "/plans/create",
  ({ secret, user, title, place, startTime, decideBy, instant, plan }) =>
    receive({ secret, title, place, startTime, decideBy })
      .where(now(instant))
      .then(Identifying.identify({ secret }).responds({ user }))
      .then(
        Planning.create({ organizer: user, title, place, startTime, now: instant }).responds({
          plan,
        }),
      )
      .then(RSVPing.open({ event: plan, decideBy }).responds({}))
      .then(respond({ plan })),
  {
    input: { required: ["secret", "title", "place", "startTime", "decideBy"] },
    validators: { input: createPlanInput },
  },
);

/** Opening responses for a plan counts its organizer as going. */
const OrganizerIsGoing = reaction(({ event, organizer, instant }) =>
  when(RSVPing.open({ event }).responds({}))
    .where(Planning._details({ plan: event }).is({ organizer }), now(instant))
    .then(RSVPing.respond({ user: organizer, event, status: "GOING", now: instant })),
);

// ----------------------------------------------------------------- Viewing

const PlanPage = former(
  "the plan page (plan)",
  (
    { plan },
    {
      organizer,
      organizerName,
      title,
      place,
      startTime,
      cancelled,
      decideBy,
      rUser,
      rName,
      rStatus,
      rOnTime,
      rTotal,
      wUser,
      wName,
      wLeftAt,
      wEta,
      aUser,
      aName,
      aLeftAt,
      aArrivedAt,
    },
  ) =>
    where(
      Planning._details({ plan }).is({ organizer, title, place, startTime, cancelled }),
      Identifying._name({ user: organizer }).is({ name: organizerName }),
      RSVPing._decideBy({ event: plan }).is({ decideBy }),
    ).form({
      plan,
      organizer,
      organizerName,
      title,
      place,
      startTime,
      cancelled,
      decideBy,
      responses: each(RSVPing._responses({ event: plan }).is({ user: rUser, status: rStatus }))
        .where(
          Identifying._name({ user: rUser }).is({ name: rName }),
          PunctualityTracking._summary({ user: rUser, limit: 5 }).is({
            onTime: rOnTime,
            total: rTotal,
          }),
        )
        .form({ user: rUser, name: rName, status: rStatus, onTime: rOnTime, total: rTotal }),
      onTheWay: each(
        ArrivalTracking._onTheWay({ event: plan }).is({ user: wUser, leftAt: wLeftAt, etaMinutes: wEta }),
      )
        .where(Identifying._name({ user: wUser }).is({ name: wName }))
        .form({ user: wUser, name: wName, leftAt: wLeftAt, etaMinutes: wEta }),
      arrived: each(
        ArrivalTracking._arrived({ event: plan }).is({
          user: aUser,
          leftAt: aLeftAt,
          arrivedAt: aArrivedAt,
        }),
      )
        .where(Identifying._name({ user: aUser }).is({ name: aName }))
        .form({ user: aUser, name: aName, leftAt: aLeftAt, arrivedAt: aArrivedAt }),
    }),
);

/**
 * Viewing settles the decide-by deadline first: any maybe past its time
 * becomes a no before the page is formed. This is how expiry happens without a
 * scheduler.
 */
const ViewPlan = endpoint(
  "/plans/view",
  ({ secret, user, plan, instant }) =>
    receive({ secret, plan })
      .where(now(instant))
      .then(Identifying.identify({ secret }).responds({ user }))
      .then(RSVPing.expireMaybes({ event: plan, now: instant }).responds({}))
      .then(respond({ viewer: user, page: PlanPage({ plan }) })),
  { input: { required: ["secret", "plan"] }, validators: { input: secretPlanInput } },
);

const PlanList = former(
  "the plan list of (user)",
  ({ user }, { event, status, title, place, startTime, cancelled, organizer }) =>
    form({
      plans: each(RSVPing._eventsOf({ user }).is({ event, status }))
        .where(
          Planning._details({ plan: event }).is({ title, place, startTime, cancelled, organizer }),
        )
        .form({ plan: event, status, title, place, startTime, cancelled, organizer }),
    }),
);

const MyPlans = endpoint(
  "/plans/mine",
  ({ secret, user }) =>
    receive({ secret })
      .then(Identifying.identify({ secret }).responds({ user }))
      .then(respond({ viewer: user, list: PlanList({ user }) })),
  { input: { required: ["secret"] }, validators: { input: secretOnlyInput } },
);

// -------------------------------------------------- Responding and managing

const Respond = endpoint(
  "/plans/respond",
  ({ secret, user, plan, status, instant }) =>
    receive({ secret, plan, status })
      .where(now(instant))
      .then(Identifying.identify({ secret }).responds({ user }))
      .then(RSVPing.respond({ user, event: plan, status, now: instant }).responds({}))
      .then(respond({ plan, status })),
  { input: { required: ["secret", "plan", "status"] }, validators: { input: respondInput } },
);

/** Planning refuses anyone but the organizer; the endpoint only says who asked. */
const CancelPlan = endpoint(
  "/plans/cancel",
  ({ secret, user, plan }) =>
    receive({ secret, plan })
      .then(Identifying.identify({ secret }).responds({ user }))
      .then(Planning.cancel({ organizer: user, plan }).responds({}))
      .then(respond({ plan })),
  { input: { required: ["secret", "plan"] }, validators: { input: secretPlanInput } },
);

// ---------------------------------------------------------------- Arriving

const Leave = endpoint(
  "/plans/leave",
  ({ secret, user, plan, etaMinutes, instant }) =>
    receive({ secret, plan, etaMinutes })
      .where(now(instant))
      .then(Identifying.identify({ secret }).responds({ user }))
      .then(ArrivalTracking.leave({ user, event: plan, etaMinutes, now: instant }).responds({}))
      .then(respond({ plan })),
  { input: { required: ["secret", "plan", "etaMinutes"] }, validators: { input: leaveInput } },
);

const Arrive = endpoint(
  "/plans/arrive",
  ({ secret, user, plan, instant, arrivedAt }) =>
    receive({ secret, plan })
      .where(now(instant))
      .then(Identifying.identify({ secret }).responds({ user }))
      .then(ArrivalTracking.arrive({ user, event: plan, now: instant }).responds({ arrivedAt }))
      .then(respond({ plan, arrivedAt })),
  { input: { required: ["secret", "plan"] }, validators: { input: secretPlanInput } },
);

/**
 * Arriving writes the on-time record. ArrivalTracking knows when you arrived,
 * Planning knows when the plan started, PunctualityTracking turns the two
 * instants into minutes late. None of the three knows the others exist.
 */
const RecordArrival = reaction(({ user, event, arrivedAt, startTime }) =>
  when(ArrivalTracking.arrive({ user, event }).responds({ arrivedAt }))
    .where(Planning._details({ plan: event }).is({ startTime }))
    .then(PunctualityTracking.record({ user, event, dueAt: startTime, arrivedAt })),
);

export const composition = {
  Creating: { CreatePlan, OrganizerIsGoing },
  Viewing: { ViewPlan, PlanPage, MyPlans, PlanList },
  Responding: { Respond },
  Managing: { CancelPlan },
  Arriving: { Leave, Arrive, RecordArrival },
};
