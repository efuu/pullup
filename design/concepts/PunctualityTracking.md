# PunctualityTracking

## Purpose

Keep a factual record of whether each person arrived on time, so a group's expectations come from history instead of assumption.

## Principle

After an arrival is recorded for a user at an event, together with when the event was due and when the user arrived, that user's recent record (on time n of the last m events) can be shown, and it grows with every event they attend.

## Types

```types
external User
  The person whose record this is.
external Event
  The event attended.
```

## State

```state
a set of Records with
  a user User
  an event Event
  a minutesLate Number
  a recordedAt DateTime
  unique user and event
```

## Actions

```actions
record(user: User, event: Event, dueAt: DateTime, arrivedAt: DateTime) : returns (minutesLate: Number)
  where a record already exists for this user and event
  then
    refuses ALREADY_RECORDED "Arrival already recorded."
  where no record exists for this user and event
  then
    set minutesLate to the whole minutes by which arrivedAt is after dueAt, or 0 if it is not after
    add a record for user and event with minutesLate and recordedAt arrivedAt
    returns minutesLate
```

## Queries

```queries
_recent(user: User, limit: Number) : many (event: Event, minutesLate: Number)
  Answers the user's most recent records, newest first, at most limit rows, and no rows for a user with no record.

_summary(user: User, limit: Number) : one (onTime: Number, total: Number)
  Answers how many of the user's most recent limit records have minutesLate 0, and how many records that is; 0 and 0 for a user with no record.
```
