# RSVPing

## Purpose

Produce a reliable headcount for an event by letting people say "maybe," but only until a deadline.

## Principle

After responses are opened for an event with a decide-by time, each user can answer going, maybe, or no, and change their answer. Once the decide-by time has passed, every remaining maybe becomes no, so from then on the going users are the headcount.

## Types

```types
external User
  The person responding.
external Event
  The thing being responded to.
Status is GOING or MAYBE or NO
  Whether the user is coming.
```

## State

```state
a set of Events with
  a decideBy DateTime

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
    add event with decideBy
    returns

respond(user: User, event: Event, status: Status, now: DateTime) : returns ()
  where responses are not open for event
  then
    refuses NOT_OPEN "This event is not taking responses."
  where status is MAYBE and the event's decideBy is not after now
  then
    refuses MAYBE_CLOSED "It's past the decide-by time, so pick going or can't."
  where responses are open and the status is allowed
  then
    set this user's response for event to status, replacing any earlier response
    returns

expireMaybes(event: Event, now: DateTime) : returns (expired: Number)
  where responses are not open for event
  then
    refuses NOT_OPEN "This event is not taking responses."
  where the event's decideBy is after now
  then
    set expired to 0
    returns expired
  where the event's decideBy is not after now
  then
    set every MAYBE response for event to NO
    set expired to the number of responses changed
    returns expired
```

## Queries

```queries
_responses(event: Event) : many (user: User, status: Status)
  Answers every response for event in the order they were first given, and no rows when nobody has responded.

_decideBy(event: Event) : optional (decideBy: DateTime)
  Answers the event's decide-by time, and no row when responses were never opened.

_eventsOf(user: User) : many (event: Event, status: Status)
  Answers every event the user has responded to, most recently responded first, and no rows for a user who never responded.

_sharedEvents(user: User, other: User) : many (event: Event)
  Answers every event to which both user and other responded GOING, earliest first, and no rows when they have none in common; when user and other are the same person, every event that person is going to.
```
