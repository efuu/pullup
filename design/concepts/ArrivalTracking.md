# ArrivalTracking

## Purpose

Show, truthfully and live, who has left for an event and who has arrived.

## Principle

A user who has done nothing is shown as not left. After they tap leave they are shown as on the way, with how long ago they left and roughly how far away they are. After they tap arrive they are shown as here, with the arrival time.

## Types

```types
external User
external Event
```

## State

```state
a set of Statuses with
  a User
  an Event
  a leftAt DateTime
  an optional etaMinutes Number
  an optional arrivedAt DateTime
  unique user and event
```

## Actions

```actions
leave(user: User, event: Event, etaMinutes?: Number) : returns ()
  where this user has no status for the event
  then
    creates a status with leftAt now and the given etaMinutes, or none if omitted
    returns
  where this user already has a status for the event
  then
    refuses ALREADY_LEFT "You already said you left."

updateEta(user: User, event: Event, etaMinutes: Number) : returns ()
  where this user has a status for the event with no arrivedAt
  then
    sets etaMinutes
    returns
  where this user has no status for the event, or has already arrived
  then
    refuses NOT_ON_THE_WAY "Tap leaving first."

arrive(user: User, event: Event) : returns (arrivedAt: DateTime)
  where this user has no status for the event
  then
    creates a status with leftAt now and arrivedAt now
    returns arrivedAt
  where this user has a status for the event with no arrivedAt
  then
    sets arrivedAt to now
    returns arrivedAt
  where this user has a status for the event with an arrivedAt
  then
    refuses ALREADY_ARRIVED "You're already marked as here."
```

## Queries

```queries
_board(event: Event) : many (user: User, leftAt: DateTime, etaMinutes: Number, arrivedAt: DateTime)
  One row per user who has left or arrived; anyone not listed hasn't left yet.
```

## Notes

Everything is self-reported, on purpose. The comparables that share live location (Find My, Life360) are exactly the ones friend groups refuse to adopt. The honesty comes from the default: you cannot be "on the way" without having tapped leave at a specific time that everyone can see. Tapping arrive without ever tapping leave is allowed (people forget) and just records both at once.
