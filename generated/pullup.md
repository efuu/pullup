<!-- Generated from the PullUp assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# PullUp — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### ArrivalTracking

Defined in [ArrivalTracking](../design/concepts/ArrivalTracking.md), line 1.

#### Actions

- `leave(user: User, event: Event, etaMinutes: Number, now: DateTime) : returns ()`
  - Refuses `INVALID_ETA`: Give an estimate between 0 and 600 minutes.
  - Refuses `ALREADY_LEFT`: You already said you left.
- `updateEta(user: User, event: Event, etaMinutes: Number) : returns ()`
  - Refuses `INVALID_ETA`: Give an estimate between 0 and 600 minutes.
  - Refuses `NOT_ON_THE_WAY`: Say you're leaving first.
- `arrive(user: User, event: Event, now: DateTime) : returns (arrivedAt: DateTime)`
  - Refuses `ALREADY_ARRIVED`: You're already marked as here.

#### Queries

- `_onTheWay(event: Event) : many (user: User, leftAt: DateTime, etaMinutes: Number)`
- `_arrived(event: Event) : many (user: User, leftAt: DateTime, arrivedAt: DateTime)`

#### Instances

- `ArrivalTracking` — instance of `ArrivalTracking` — [Application types](../design/types.md), line 15.
  - `Event` is `Planning.Plan` — [Application types](../design/types.md), line 17.
  - `User` is `Identifying.User` — [Application types](../design/types.md), line 16.

### Identifying

Defined in [Identifying](../design/concepts/Identifying.md), line 1.

#### Actions

- `claim(name: String) : returns (user: User, secret: String)`
  - Refuses `INVALID_NAME`: Enter a name of at most 40 characters.
- `identify(secret: String) : returns (user: User)`
  - Refuses `UNKNOWN_SECRET`: This browser is not recognized. Enter your name again.
- `rename(user: User, name: String) : returns ()`
  - Refuses `UNKNOWN_USER`: There is no such user.
  - Refuses `INVALID_NAME`: Enter a name of at most 40 characters.

#### Queries

- `_name(user: User) : optional (name: String)`

#### Instances

- `Identifying` — instance of `Identifying` — [Application types](../design/types.md), line 6.

### Planning

Defined in [Planning](../design/concepts/Planning.md), line 1.

#### Actions

- `create(organizer: User, title: String, place: String, startTime: DateTime, now: DateTime) : returns (plan: Plan)`
  - Refuses `INVALID_DETAILS`: Give the plan a title and a place, each at most 80 characters.
  - Refuses `START_IN_PAST`: Pick a start time that hasn't happened yet.
- `reschedule(organizer: User, plan: Plan, startTime: DateTime) : returns ()`
  - Refuses `UNKNOWN_PLAN`: There is no such plan.
  - Refuses `NOT_ORGANIZER`: Only the organizer can change the plan.
  - Refuses `PLAN_CANCELLED`: This plan was cancelled.
- `cancel(organizer: User, plan: Plan) : returns ()`
  - Refuses `UNKNOWN_PLAN`: There is no such plan.
  - Refuses `NOT_ORGANIZER`: Only the organizer can cancel the plan.
  - Refuses `PLAN_CANCELLED`: This plan was already cancelled.

#### Queries

- `_details(plan: Plan) : optional (organizer: User, title: String, place: String, startTime: DateTime, cancelled: Flag)`

#### Instances

- `Planning` — instance of `Planning` — [Application types](../design/types.md), line 8.
  - `User` is `Identifying.User` — [Application types](../design/types.md), line 9.

### PunctualityTracking

Defined in [PunctualityTracking](../design/concepts/PunctualityTracking.md), line 1.

#### Actions

- `record(user: User, event: Event, dueAt: DateTime, arrivedAt: DateTime) : returns (minutesLate: Number)`
  - Refuses `ALREADY_RECORDED`: Arrival already recorded.

#### Queries

- `_recent(user: User, limit: Number) : many (event: Event, minutesLate: Number)`
- `_summary(user: User, limit: Number) : one (onTime: Number, total: Number)`

#### Instances

- `PunctualityTracking` — instance of `PunctualityTracking` — [Application types](../design/types.md), line 19.
  - `Event` is `Planning.Plan` — [Application types](../design/types.md), line 21.
  - `User` is `Identifying.User` — [Application types](../design/types.md), line 20.

### RSVPing

Defined in [RSVPing](../design/concepts/RSVPing.md), line 1.

#### Actions

- `open(event: Event, decideBy: DateTime) : returns ()`
  - Refuses `ALREADY_OPEN`: Responses are already open for this event.
- `close(event: Event) : returns ()`
  - Refuses `NOT_OPEN`: This event is not taking responses.
- `respond(user: User, event: Event, status: Status, now: DateTime) : returns ()`
  - Refuses `NOT_OPEN`: This event is not taking responses.
  - Refuses `MAYBE_CLOSED`: It's past the decide-by time, so pick going or can't.

#### Queries

- `_responses(event: Event) : many (user: User, status: Status)`
- `_standing(event: Event, now: DateTime) : many (user: User, status: Status, lapsed: Flag)`
- `_decideBy(event: Event) : optional (decideBy: DateTime, closed: Flag)`
- `_eventsOf(user: User) : many (event: Event, status: Status)`
- `_sharedEvents(user: User, other: User) : many (event: Event)`

#### Instances

- `RSVPing` — instance of `RSVPing` — [Application types](../design/types.md), line 11.
  - `Event` is `Planning.Plan` — [Application types](../design/types.md), line 13.
  - `User` is `Identifying.User` — [Application types](../design/types.md), line 12.

## Views

_Views name reusable conditions. Multiple `where` blocks are alternatives._

### (viewer) shares a plan with (target)

Authored path: `Records.Viewing.sharesAPlan`.
- Covered by [Records](../design/compositions/Records.md), line 5.

```view
(viewer) shares a plan with (target) — inputs (viewer, target); outputs (); bindings ()
  where RSVPing._sharedEvents (other: target, user: viewer)
```

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### the plan list of (user)

Authored path: `Plans.Viewing.PlanList`.
- Covered by [Plans](../design/compositions/Plans.md), line 36.

```former
Former "the plan list of (user)" — inputs (user); bindings (event, status, title, place, startTime, cancelled, organizer); promises exactly one record — forms:
  a record of
    plans: each RSVPing._eventsOf (user) has (event, status)
      where Planning._details (plan: event) has (cancelled, organizer, place, startTime, title)
      form a record of
        cancelled
        organizer
        place
        plan: event
        startTime
        status
        title
```

### the plan page (plan) as read at (now)

Authored path: `Plans.Viewing.PlanPage`.
- Covered by [Plans](../design/compositions/Plans.md), line 22.

```former
Former "the plan page (plan) as read at (now)" — inputs (plan, now); bindings (organizer, organizerName, title, place, startTime, cancelled, decideBy, closed, rUser, rName, rStatus, rLapsed, rOnTime, rTotal, wUser, wName, wLeftAt, wEta, aUser, aName, aLeftAt, aArrivedAt); promises exactly one record — forms:
  a record of
    where Planning._details (plan) has (cancelled, organizer, place, startTime, title)
    where Identifying._name (user: organizer) has (name: organizerName)
    where RSVPing._decideBy (event: plan) has (closed, decideBy)
    arrived: each ArrivalTracking._arrived (event: plan) has (arrivedAt: aArrivedAt, leftAt: aLeftAt, user: aUser)
      where Identifying._name (user: aUser) has (name: aName)
      form a record of
        arrivedAt: aArrivedAt
        leftAt: aLeftAt
        name: aName
        user: aUser
    cancelled
    closed
    decideBy
    onTheWay: each ArrivalTracking._onTheWay (event: plan) has (etaMinutes: wEta, leftAt: wLeftAt, user: wUser)
      where Identifying._name (user: wUser) has (name: wName)
      form a record of
        etaMinutes: wEta
        leftAt: wLeftAt
        name: wName
        user: wUser
    organizer
    organizerName
    place
    plan
    responses: each RSVPing._standing (event: plan, now) has (lapsed: rLapsed, status: rStatus, user: rUser)
      where Identifying._name (user: rUser) has (name: rName)
      where PunctualityTracking._summary (limit: 5, user: rUser) has (onTime: rOnTime, total: rTotal)
      form a record of
        lapsed: rLapsed
        name: rName
        onTime: rOnTime
        status: rStatus
        total: rTotal
        user: rUser
    startTime
    title
```

### the record card of (target)

Authored path: `Records.Viewing.RecordCard`.
- Covered by [Records](../design/compositions/Records.md), line 7.

```former
Former "the record card of (target)" — inputs (target); bindings (name, onTime, total, event, minutesLate, title, startTime); promises exactly one record — forms:
  a record of
    where Identifying._name (user: target) has (name)
    where PunctualityTracking._summary (limit: 5, user: target) has (onTime, total)
    name
    onTime
    recent: each PunctualityTracking._recent (limit: 5, user: target) has (event, minutesLate)
      where Planning._details (plan: event) has (startTime, title)
      form a record of
        minutesLate
        plan: event
        startTime
        title
    total
    user: target
```

## Reactions

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### Identity.Claiming.Claim

Authored path: `Identity.Claiming.Claim`.
- Covered by [Identity](../design/compositions/Identity.md), line 4.
- Covered by [Identity](../design/compositions/Identity.md), line 10.

```reaction
when RequestBoundary.request (name, path: "/me/claim", requestId)
then
  Identifying.claim (name)
```

### Identity.Claiming.Claim#2

Authored path: `Identity.Claiming.Claim`.
- Covered by [Identity](../design/compositions/Identity.md), line 4.
- Covered by [Identity](../design/compositions/Identity.md), line 10.

```reaction
when Identifying.claim (name, secret, user), asked by Identity.Claiming.Claim
where
  earlier, RequestBoundary.request (name, path: "/me/claim", requestId)
then
  RequestBoundary.respond (requestId, secret, user)
```

### Identity.Claiming.Current

Authored path: `Identity.Claiming.Current`.
- Covered by [Identity](../design/compositions/Identity.md), line 13.
- Covered by [Identity](../design/compositions/Identity.md), line 17.

```reaction
when RequestBoundary.request (path: "/me/current", requestId, secret)
then
  Identifying.identify (secret)
```

### Identity.Claiming.Current#2

Authored path: `Identity.Claiming.Current`.
- Covered by [Identity](../design/compositions/Identity.md), line 13.
- Covered by [Identity](../design/compositions/Identity.md), line 17.

```reaction
when Identifying.identify (secret, user), asked by Identity.Claiming.Current
where
  Identifying._name (user) has (name)
  earlier, RequestBoundary.request (path: "/me/current", requestId, secret)
then
  RequestBoundary.respond (name, requestId, user)
```

### Identity.Claiming.Rename

Authored path: `Identity.Claiming.Rename`.
- Covered by [Identity](../design/compositions/Identity.md), line 20.
- Covered by [Identity](../design/compositions/Identity.md), line 25.

```reaction
when RequestBoundary.request (name, path: "/me/rename", requestId, secret)
then
  Identifying.identify (secret)
```

### Identity.Claiming.Rename#2

Authored path: `Identity.Claiming.Rename`.
- Covered by [Identity](../design/compositions/Identity.md), line 20.
- Covered by [Identity](../design/compositions/Identity.md), line 25.

```reaction
when Identifying.identify (secret, user), asked by Identity.Claiming.Rename
where
  earlier, RequestBoundary.request (name, path: "/me/rename", requestId, secret)
then
  Identifying.rename (name, user)
```

### Identity.Claiming.Rename#3

Authored path: `Identity.Claiming.Rename`.
- Covered by [Identity](../design/compositions/Identity.md), line 20.
- Covered by [Identity](../design/compositions/Identity.md), line 25.

```reaction
when Identifying.rename (name, user), asked by Identity.Claiming.Rename#2
where
  earlier, RequestBoundary.request (name, path: "/me/rename", requestId, secret)
then
  RequestBoundary.respond (name, requestId, user)
```

### Plans.Arriving.Arrive

Authored path: `Plans.Arriving.Arrive`.
- Covered by [Plans](../design/compositions/Plans.md), line 67.
- Covered by [Plans](../design/compositions/Plans.md), line 76.

```reaction
when RequestBoundary.request (path: "/plans/arrive", plan, requestId, secret)
where
  instant is the current flow's instant
then
  Identifying.identify (secret)
```

### Plans.Arriving.Arrive#2

Authored path: `Plans.Arriving.Arrive`.
- Covered by [Plans](../design/compositions/Plans.md), line 67.
- Covered by [Plans](../design/compositions/Plans.md), line 76.

```reaction
when Identifying.identify (secret, user), asked by Plans.Arriving.Arrive
where
  earlier, RequestBoundary.request (path: "/plans/arrive", plan, requestId, secret)
  instant is the current flow's instant
then
  ArrivalTracking.arrive (event: plan, now: instant, user)
```

### Plans.Arriving.Arrive#3

Authored path: `Plans.Arriving.Arrive`.
- Covered by [Plans](../design/compositions/Plans.md), line 67.
- Covered by [Plans](../design/compositions/Plans.md), line 76.

```reaction
when ArrivalTracking.arrive (event: plan, now: instant, user, arrivedAt), asked by Plans.Arriving.Arrive#2
where
  earlier, RequestBoundary.request (path: "/plans/arrive", plan, requestId, secret)
then
  RequestBoundary.respond (arrivedAt, plan, requestId)
```

### Plans.Arriving.Leave

Authored path: `Plans.Arriving.Leave`.
- Covered by [Plans](../design/compositions/Plans.md), line 65.
- Covered by [Plans](../design/compositions/Plans.md), line 74.

```reaction
when RequestBoundary.request (etaMinutes, path: "/plans/leave", plan, requestId, secret)
where
  instant is the current flow's instant
then
  Identifying.identify (secret)
```

### Plans.Arriving.Leave#2

Authored path: `Plans.Arriving.Leave`.
- Covered by [Plans](../design/compositions/Plans.md), line 65.
- Covered by [Plans](../design/compositions/Plans.md), line 74.

```reaction
when Identifying.identify (secret, user), asked by Plans.Arriving.Leave
where
  earlier, RequestBoundary.request (etaMinutes, path: "/plans/leave", plan, requestId, secret)
  instant is the current flow's instant
then
  ArrivalTracking.leave (etaMinutes, event: plan, now: instant, user)
```

### Plans.Arriving.Leave#3

Authored path: `Plans.Arriving.Leave`.
- Covered by [Plans](../design/compositions/Plans.md), line 65.
- Covered by [Plans](../design/compositions/Plans.md), line 74.

```reaction
when ArrivalTracking.leave (etaMinutes, event: plan, now: instant, user), asked by Plans.Arriving.Leave#2
where
  earlier, RequestBoundary.request (etaMinutes, path: "/plans/leave", plan, requestId, secret)
then
  RequestBoundary.respond (plan, requestId)
```

### Plans.Arriving.RecordArrival

Authored path: `Plans.Arriving.RecordArrival`.
- Covered by [Plans](../design/compositions/Plans.md), line 68.

```reaction
when ArrivalTracking.arrive (event, user, arrivedAt)
where
  Planning._details (plan: event) has (startTime)
then
  PunctualityTracking.record (arrivedAt, dueAt: startTime, event, user)
```

### Plans.Arriving.UpdateEta

Authored path: `Plans.Arriving.UpdateEta`.
- Covered by [Plans](../design/compositions/Plans.md), line 66.
- Covered by [Plans](../design/compositions/Plans.md), line 75.

```reaction
when RequestBoundary.request (etaMinutes, path: "/plans/eta", plan, requestId, secret)
then
  Identifying.identify (secret)
```

### Plans.Arriving.UpdateEta#2

Authored path: `Plans.Arriving.UpdateEta`.
- Covered by [Plans](../design/compositions/Plans.md), line 66.
- Covered by [Plans](../design/compositions/Plans.md), line 75.

```reaction
when Identifying.identify (secret, user), asked by Plans.Arriving.UpdateEta
where
  earlier, RequestBoundary.request (etaMinutes, path: "/plans/eta", plan, requestId, secret)
then
  ArrivalTracking.updateEta (etaMinutes, event: plan, user)
```

### Plans.Arriving.UpdateEta#3

Authored path: `Plans.Arriving.UpdateEta`.
- Covered by [Plans](../design/compositions/Plans.md), line 66.
- Covered by [Plans](../design/compositions/Plans.md), line 75.

```reaction
when ArrivalTracking.updateEta (etaMinutes, event: plan, user), asked by Plans.Arriving.UpdateEta#2
where
  earlier, RequestBoundary.request (etaMinutes, path: "/plans/eta", plan, requestId, secret)
then
  RequestBoundary.respond (etaMinutes, plan, requestId)
```

### Plans.Creating.CreatePlan

Authored path: `Plans.Creating.CreatePlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 8.
- Covered by [Plans](../design/compositions/Plans.md), line 16.

```reaction
when RequestBoundary.request (decideBy, path: "/plans/create", place, requestId, secret, startTime, title)
where
  instant is the current flow's instant
then
  Identifying.identify (secret)
```

### Plans.Creating.CreatePlan#2

Authored path: `Plans.Creating.CreatePlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 8.
- Covered by [Plans](../design/compositions/Plans.md), line 16.

```reaction
when Identifying.identify (secret, user), asked by Plans.Creating.CreatePlan
where
  earlier, RequestBoundary.request (decideBy, path: "/plans/create", place, requestId, secret, startTime, title)
  instant is the current flow's instant
then
  Planning.create (now: instant, organizer: user, place, startTime, title)
```

### Plans.Creating.CreatePlan#3

Authored path: `Plans.Creating.CreatePlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 8.
- Covered by [Plans](../design/compositions/Plans.md), line 16.

```reaction
when Planning.create (now: instant, organizer: user, place, startTime, title, plan), asked by Plans.Creating.CreatePlan#2
where
  earlier, RequestBoundary.request (decideBy, path: "/plans/create", place, requestId, secret, startTime, title)
then
  RSVPing.open (decideBy, event: plan)
```

### Plans.Creating.CreatePlan#4

Authored path: `Plans.Creating.CreatePlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 8.
- Covered by [Plans](../design/compositions/Plans.md), line 16.

```reaction
when RSVPing.open (decideBy, event: plan), asked by Plans.Creating.CreatePlan#3
where
  earlier, RequestBoundary.request (decideBy, path: "/plans/create", place, requestId, secret, startTime, title)
then
  RequestBoundary.respond (plan, requestId)
```

### Plans.Creating.OrganizerIsGoing

Authored path: `Plans.Creating.OrganizerIsGoing`.
- Covered by [Plans](../design/compositions/Plans.md), line 11.

```reaction
when RSVPing.open (event)
where
  Planning._details (plan: event) has (organizer)
  instant is the current flow's instant
then
  RSVPing.respond (event, now: instant, status: "GOING", user: organizer)
```

### Plans.Managing.CancelClosesResponses

Authored path: `Plans.Managing.CancelClosesResponses`.
- Covered by [Plans](../design/compositions/Plans.md), line 55.

```reaction
when Planning.cancel (plan)
then
  RSVPing.close (event: plan)
```

### Plans.Managing.CancelPlan

Authored path: `Plans.Managing.CancelPlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 53.
- Covered by [Plans](../design/compositions/Plans.md), line 60.

```reaction
when RequestBoundary.request (path: "/plans/cancel", plan, requestId, secret)
then
  Identifying.identify (secret)
```

### Plans.Managing.CancelPlan#2

Authored path: `Plans.Managing.CancelPlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 53.
- Covered by [Plans](../design/compositions/Plans.md), line 60.

```reaction
when Identifying.identify (secret, user), asked by Plans.Managing.CancelPlan
where
  earlier, RequestBoundary.request (path: "/plans/cancel", plan, requestId, secret)
then
  Planning.cancel (organizer: user, plan)
```

### Plans.Managing.CancelPlan#3

Authored path: `Plans.Managing.CancelPlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 53.
- Covered by [Plans](../design/compositions/Plans.md), line 60.

```reaction
when Planning.cancel (organizer: user, plan), asked by Plans.Managing.CancelPlan#2
where
  earlier, RequestBoundary.request (path: "/plans/cancel", plan, requestId, secret)
then
  RequestBoundary.respond (plan, requestId)
```

### Plans.Managing.ReschedulePlan

Authored path: `Plans.Managing.ReschedulePlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 52.
- Covered by [Plans](../design/compositions/Plans.md), line 59.

```reaction
when RequestBoundary.request (path: "/plans/reschedule", plan, requestId, secret, startTime)
then
  Identifying.identify (secret)
```

### Plans.Managing.ReschedulePlan#2

Authored path: `Plans.Managing.ReschedulePlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 52.
- Covered by [Plans](../design/compositions/Plans.md), line 59.

```reaction
when Identifying.identify (secret, user), asked by Plans.Managing.ReschedulePlan
where
  earlier, RequestBoundary.request (path: "/plans/reschedule", plan, requestId, secret, startTime)
then
  Planning.reschedule (organizer: user, plan, startTime)
```

### Plans.Managing.ReschedulePlan#3

Authored path: `Plans.Managing.ReschedulePlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 52.
- Covered by [Plans](../design/compositions/Plans.md), line 59.

```reaction
when Planning.reschedule (organizer: user, plan, startTime), asked by Plans.Managing.ReschedulePlan#2
where
  earlier, RequestBoundary.request (path: "/plans/reschedule", plan, requestId, secret, startTime)
then
  RequestBoundary.respond (plan, requestId, startTime)
```

### Plans.Responding.Respond

Authored path: `Plans.Responding.Respond`.
- Covered by [Plans](../design/compositions/Plans.md), line 45.
- Covered by [Plans](../design/compositions/Plans.md), line 49.

```reaction
when RequestBoundary.request (path: "/plans/respond", plan, requestId, secret, status)
where
  instant is the current flow's instant
then
  Identifying.identify (secret)
```

### Plans.Responding.Respond#2

Authored path: `Plans.Responding.Respond`.
- Covered by [Plans](../design/compositions/Plans.md), line 45.
- Covered by [Plans](../design/compositions/Plans.md), line 49.

```reaction
when Identifying.identify (secret, user), asked by Plans.Responding.Respond
where
  earlier, RequestBoundary.request (path: "/plans/respond", plan, requestId, secret, status)
  instant is the current flow's instant
then
  RSVPing.respond (event: plan, now: instant, status, user)
```

### Plans.Responding.Respond#3

Authored path: `Plans.Responding.Respond`.
- Covered by [Plans](../design/compositions/Plans.md), line 45.
- Covered by [Plans](../design/compositions/Plans.md), line 49.

```reaction
when RSVPing.respond (event: plan, now: instant, status, user), asked by Plans.Responding.Respond#2
where
  earlier, RequestBoundary.request (path: "/plans/respond", plan, requestId, secret, status)
then
  RequestBoundary.respond (plan, requestId, status)
```

### Plans.Viewing.MyPlans

Authored path: `Plans.Viewing.MyPlans`.
- Covered by [Plans](../design/compositions/Plans.md), line 35.
- Covered by [Plans](../design/compositions/Plans.md), line 40.

```reaction
when RequestBoundary.request (path: "/plans/mine", requestId, secret)
then
  Identifying.identify (secret)
```

### Plans.Viewing.MyPlans#2

Authored path: `Plans.Viewing.MyPlans`.
- Covered by [Plans](../design/compositions/Plans.md), line 35.
- Covered by [Plans](../design/compositions/Plans.md), line 40.

```reaction
when Identifying.identify (secret, user), asked by Plans.Viewing.MyPlans
where
  earlier, RequestBoundary.request (path: "/plans/mine", requestId, secret)
then
  RequestBoundary.respond (list: former "the plan list of (user)" with (user), requestId, viewer: user)
```

### Plans.Viewing.ViewPlan

Authored path: `Plans.Viewing.ViewPlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 21.
- Covered by [Plans](../design/compositions/Plans.md), line 32.

```reaction
when RequestBoundary.request (path: "/plans/view", plan, requestId, secret)
where
  instant is the current flow's instant
then
  Identifying.identify (secret)
```

### Plans.Viewing.ViewPlan#2

Authored path: `Plans.Viewing.ViewPlan`.
- Covered by [Plans](../design/compositions/Plans.md), line 21.
- Covered by [Plans](../design/compositions/Plans.md), line 32.

```reaction
when Identifying.identify (secret, user), asked by Plans.Viewing.ViewPlan
where
  earlier, RequestBoundary.request (path: "/plans/view", plan, requestId, secret)
  instant is the current flow's instant
then
  RequestBoundary.respond (page: former "the plan page (plan) as read at (now)" with (now: instant, plan), requestId, viewer: user)
```

### Records.Viewing.ViewRecord

Authored path: `Records.Viewing.ViewRecord`.
- Covered by [Records](../design/compositions/Records.md), line 4.
- Covered by [Records](../design/compositions/Records.md), line 14.

```reaction
when RequestBoundary.request (path: "/records/view", requestId, secret, target)
then
  Identifying.identify (secret)
```

### Records.Viewing.ViewRecord:not-shared#2

Authored path: `Records.Viewing.ViewRecord`.
- Covered by [Records](../design/compositions/Records.md), line 4.
- Covered by [Records](../design/compositions/Records.md), line 14.

```reaction
when Identifying.identify (secret, user: viewer), asked by Records.Viewing.ViewRecord
where
  earlier, RequestBoundary.request (path: "/records/view", requestId, secret, target)
  no RSVPing._sharedEvents (other: target, user: viewer)
then
  RequestBoundary.respond (error: "NOT_SHARED", requestId)
```

### Records.Viewing.ViewRecord:shared#2

Authored path: `Records.Viewing.ViewRecord`.
- Covered by [Records](../design/compositions/Records.md), line 4.
- Covered by [Records](../design/compositions/Records.md), line 14.

```reaction
when Identifying.identify (secret, user: viewer), asked by Records.Viewing.ViewRecord
where
  earlier, RequestBoundary.request (path: "/records/view", requestId, secret, target)
  view "(viewer) shares a plan with (target)" with (target, viewer)
then
  RequestBoundary.respond (card: former "the record card of (target)" with (target), requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/me/claim` — requires `name`
- `/me/current` — requires `secret`
- `/me/rename` — requires `secret`, `name`
- `/plans/arrive` — requires `secret`, `plan`
- `/plans/cancel` — requires `secret`, `plan`
- `/plans/create` — requires `secret`, `title`, `place`, `startTime`, `decideBy`
- `/plans/eta` — requires `secret`, `plan`, `etaMinutes`
- `/plans/leave` — requires `secret`, `plan`, `etaMinutes`
- `/plans/mine` — requires `secret`
- `/plans/reschedule` — requires `secret`, `plan`, `startTime`
- `/plans/respond` — requires `secret`, `plan`, `status`
- `/plans/view` — requires `secret`, `plan`
- `/records/view` — requires `secret`, `target`
