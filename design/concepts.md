# Concept design


| Concept | One line |
|---|---|
| [Identifying](concepts/Identifying.md) | a name plus a browser secret (instead of accounts) |
| [Planning](concepts/Planning.md) | the plan (who, what, where, when) |
| [RSVPing](concepts/RSVPing.md) [User, Event] | going / maybe / no |
| [ArrivalTracking](concepts/ArrivalTracking.md) [User, Event] | self-reported leaving and arriving, live |
| [PunctualityTracking](concepts/PunctualityTracking.md) [User, Event] | the factual on-time record |

## Essential reactions

**Creating a plan opens responses and counts the organizer in.** The "decide by" time defaults off the start time, and an organizer does not need to RSVP to their own plan.

```
reaction openResponses
  when Planning.create (startTime) : (plan)
  then RSVPing.open (event: plan, decideBy: startTime minus 4 hours)

reaction organizerIsGoing
  when Planning.create (organizer) : (plan)
  then RSVPing.respond (user: organizer, event: plan, status: GOING)
```

**Identity on every request** (access control, representative). The browser only sends its secret and concepts only see a User. 

```
reaction respondAsUser
  when Requesting.respond (secret, plan, status)
  where Identifying.identify (secret) : (user)
  then RSVPing.respond (user, event: plan, status)

reaction cancelAsOrganizer
  when Requesting.cancelPlan (secret, plan)
  where Identifying.identify (secret) : (user)
  then Planning.cancel (organizer: user, plan)
```

`Planning.cancel` itself refuses anyone but the organizer

```
reaction recordArrival
  when ArrivalTracking.arrive (user, event) : (arrivedAt)
  where Planning._details (plan: event) : (startTime)
  then PunctualityTracking.record (user, event, minutesLate: max (0, arrivedAt minus startTime))
```

**Viewing a record is limited to people who have shared a plan** (access control, representative). The privacy rule is located here, not in PunctualityTracking, so that concept stays reusable.

```
reaction viewRecord
  when Requesting.viewRecord (secret, target)
  where Identifying.identify (secret) : (viewer)
        RSVPing._responses (event: e) includes both viewer and target with status GOING, for some event e
  then PunctualityTracking._summary (user: target, limit: 5)
```

**Expiring maybes needs no reaction.** `RSVPing.expireMaybes` is time-triggered (its where clause becomes true when the decide by time passes)

## Role of each concept

**Identifying.** Replaces registration, its job is to make "Dylan" on this week's plan the same user as "Dylan" from previous events (if those exist), which the on-time record needs. Generic parameters: none; it is the source of `User` for everything else.

**Planning.** Contains the facts of the outing and who is authorized to change them. `User` is instantiated with `Identifying.User`.

**RSVPing.** The "decide by" feature, this is written against a generic `Event` rather than `Plan` because nothing in it is specific to outings; the idea is so that the same concept would work for a study group or a pickup game. `Event` is `Planning.Plan`, `User` is `Identifying.User`.

**ArrivalTracking.** The pulling-up / pulled-up board, also generic over `Event`, and has the same instantiation as RSVPing. It is separate from RSVPing because the two have different lifecycles (before the day vs. on the day) and different rules (a maybe expires, a status doesn't)

**PunctualityTracking.** The on-time record, stores minutes late as a plain number, computed by the `recordArrival` reaction, rather than storing arrival times and plan times itself. This is so that it keeps it independent of both Planning and ArrivalTracking. `User` and `Event` instantiated as above.

## Changes made while implementing (P2)

The specs in [`concepts/`](concepts/) are current; the reactions above are the P1 sketch. What changed and why is in [implementation-notes.md](implementation-notes.md). In short: time-dependent actions take a `now` input, maybes expire when the page is viewed rather than on a timer, the on-time record takes the two instants and computes lateness itself, the organizer-is-going reaction fires on `RSVPing.open`, and the shared-plan rule is a query (`_sharedEvents`) wrapped by the view. The exact reactions, endpoints, views and formers are documented in [`compositions/`](compositions/).

For the beta (P3), RSVPing gained a `close` action and a `closed` flag, and a reaction closes a plan's responses when Planning cancels it; see the P3 section of the implementation notes.

After staff feedback (beta): maybes are no longer turned into no at the decide-by time. `expireMaybes` is gone; a `_standing(event, now)` query reads a maybe past its deadline as lapsed (not counted as coming) while keeping the answer. All five purposes were rewritten as the bad situation each concept prevents.
