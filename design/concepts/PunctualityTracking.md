# PunctualityTracking

## Purpose

Keep a factual record of whether each person arrived on time, so a group's expectations come from history instead of assumption.

## Principle

After an arrival is recorded for a user at an event along with how late it was, that user's recent record (on time n of the last m events) can be shown, and it grows with every event they attend.

## Types

```types
external User
external Event
```

## State

```state
a set of Records with
  a User
  an Event
  a minutesLate Number
  unique user and event
```

## Actions

```actions
record(user: User, event: Event, minutesLate: Number) : returns ()
  where no record exists for this user and event, and minutesLate is at least 0
  then
    adds a record with these values
    returns
  where a record already exists for this user and event
  then
    refuses ALREADY_RECORDED "Arrival already recorded."
```

## Queries

```queries
_recent(user: User, limit: Number) : many (event: Event, minutesLate: Number)
  The user's most recent records, newest first, up to limit.

_summary(user: User, limit: Number) : one (onTime: Number, total: Number)
  How many of the last limit records have minutesLate of 0, and how many records that is.
```

## Notes

The concept stores facts (minutes late), not judgments. "On time" means minutesLate is 0, computed by a reaction from the arrival time and the plan's start time; this concept never sees either. It also knows nothing about who may view a record. Limiting visibility to people who have shared a plan is a composition decision (see the viewRecord reaction), which keeps this concept reusable for any kind of event.
