# RSVPing

## Purpose

Produce a reliable headcount for an event by letting people say "maybe," but only until a deadline.

## Principle

After responses are opened for an event with a decide-by time, each user can answer going, maybe, or no, and change their answer. When the decide-by time passes, every remaining maybe becomes no, so from then on the going users are the headcount.

## Types

```types
external User
external Event
Status is GOING or MAYBE or NO
```

## State

```state
a set of Events with
  a decideBy DateTime

a set of Responses with
  a User
  an Event
  a status Status
  unique user and event
```

## Actions

```actions
open(event: Event, decideBy: DateTime) : returns ()
  where no responses have been opened for this event
  then
    records the event with this decideBy time
    returns

respond(user: User, event: Event, status: Status) : returns ()
  where event is open, and status is not MAYBE or decideBy is in the future
  then
    sets this user's response for the event to status, replacing any earlier one
    returns
  where event is open, status is MAYBE, and decideBy is in the past
  then
    refuses MAYBE_CLOSED "It's past the decide-by time, pick going or can't."

expireMaybes(event: Event) : returns ()
  where event is open, decideBy is in the past, and some response is MAYBE
  then
    sets every MAYBE response for the event to NO
    returns
```

## Queries

```queries
_responses(event: Event) : many (user: User, status: Status)
  Every response for the event, for the lists on the plan page.

_decideBy(event: Event) : one (decideBy: DateTime)
  When maybes expire.
```

## Notes

Going and no can still change after the deadline; people do drop out, and pretending otherwise would make the count a lie. Only maybe is closed, because maybe is the thing that keeps the count from being real. expireMaybes is time-triggered, like Expiring.expireResource in the class examples: it fires on its own once its where clause holds.
