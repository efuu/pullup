# ArrivalTracking

## Purpose

Show, truthfully and live, who has left for an event and who has arrived.

## Principle

A user who has done nothing is shown as not having left. After they say they are leaving they are shown as on the way, with when they left and roughly how far away they are. After they say they have arrived they are shown as here, with the arrival time.

## Types

```types
external User
  The person travelling.
external Event
  The event they are travelling to.
```

## State

```state
a set of Statuses with
  a user User
  an event Event
  a leftAt DateTime
  an etaMinutes Number
  a arrived Flag
  an arrivedAt DateTime
  unique user and event
Rule: arrivedAt is meaningful only while arrived is true.
```

## Actions

```actions
leave(user: User, event: Event, etaMinutes: Number, now: DateTime) : returns ()
  where etaMinutes is negative or more than 600
  then
    refuses INVALID_ETA "Give an estimate between 0 and 600 minutes."
  where this user already has a status for event
  then
    refuses ALREADY_LEFT "You already said you left."
  where this user has no status for event and etaMinutes is accepted
  then
    add a status for user and event with leftAt now, etaMinutes, and arrived false
    returns

updateEta(user: User, event: Event, etaMinutes: Number) : returns ()
  where etaMinutes is negative or more than 600
  then
    refuses INVALID_ETA "Give an estimate between 0 and 600 minutes."
  where this user has no status for event, or has already arrived
  then
    refuses NOT_ON_THE_WAY "Say you're leaving first."
  where this user is on the way to event
  then
    set etaMinutes
    returns

arrive(user: User, event: Event, now: DateTime) : returns (arrivedAt: DateTime)
  where this user has a status for event with arrived true
  then
    refuses ALREADY_ARRIVED "You're already marked as here."
  where this user has no status for event
  then
    add a status for user and event with leftAt now, etaMinutes 0, arrived true, and arrivedAt now
    returns arrivedAt
  where this user is on the way to event
  then
    set arrived to true and arrivedAt to now
    returns arrivedAt
```

## Queries

```queries
_onTheWay(event: Event) : many (user: User, leftAt: DateTime, etaMinutes: Number)
  Answers everyone who has left for event but not arrived, earliest departure first, and no rows when nobody is on the way.

_arrived(event: Event) : many (user: User, leftAt: DateTime, arrivedAt: DateTime)
  Answers everyone who has arrived at event, earliest arrival first, and no rows when nobody has arrived.
```
