# RSVPing

## Purpose

Prevent hosts and attendees from acting on a headcount that undecided answers have quietly inflated, so nobody books for eight, waits for six, and eats with four.

## Principle

After responses are opened for an event with a decide-by time, each user can answer going, maybe, or no, and change their answer. Up to the decide-by time a maybe is an honest "undecided". After it, a maybe that was never updated is read as not coming wherever attendance is counted, but the answer itself is kept: the person still said maybe, and the host can see who never decided. Nobody can newly answer maybe after the decide-by time. When the event is closed, no further responses are taken, but the ones given stay readable.

## Types

```types
external User
  The person responding.
external Event
  The thing being responded to.
Status is GOING or MAYBE or NO
  What the person said.
```

## State

```state
a set of Events with
  a decideBy DateTime
  a closed Flag

a set of Responses with
  a user User
  an event Event
  a status Status
  unique user and event
```

## Actions

```actions
open(event: Event, decideBy: DateTime) : returns ()
  where responses are already open for event
  then
    refuses ALREADY_OPEN "Responses are already open for this event."
  where responses are not yet open for event
  then
    add event with decideBy and closed false
    returns

close(event: Event) : returns ()
  where responses were never opened for event
  then
    refuses NOT_OPEN "This event is not taking responses."
  where responses are open for event
  then
    set closed to true
    returns

respond(user: User, event: Event, status: Status, now: DateTime) : returns ()
  where responses were never opened for event, or event is closed
  then
    refuses NOT_OPEN "This event is not taking responses."
  where status is MAYBE and the event's decideBy is not after now
  then
    refuses MAYBE_CLOSED "It's past the decide-by time, so pick going or can't."
  where responses are open and the status is allowed
  then
    set this user's response for event to status, replacing any earlier response
    returns
```

## Queries

```queries
_responses(event: Event) : many (user: User, status: Status)
  Answers every response for event as given, in the order they were first given, and no rows when nobody has responded.

_standing(event: Event, now: DateTime) : many (user: User, status: Status, lapsed: Flag)
  Answers every response for event with how it reads at now: lapsed is true for a MAYBE whose decide-by time is not after now, meaning the person never decided and is not counted as coming; the status itself is unchanged. Same order as _responses; no rows when nobody has responded.

_decideBy(event: Event) : optional (decideBy: DateTime, closed: Flag)
  Answers the event's decide-by time and whether it is closed, and no row when responses were never opened.

_eventsOf(user: User) : many (event: Event, status: Status)
  Answers every event the user has responded to, most recently responded first, and no rows for a user who never responded.

_sharedEvents(user: User, other: User) : many (event: Event)
  Answers every event to which both user and other responded GOING, earliest first, and no rows when they have none in common; when user and other are the same person, every event that person is going to.
```
