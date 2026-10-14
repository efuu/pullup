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
