# Planning

## Purpose

Let one person propose a specific outing (what, where, when) that everyone else can refer to.

## Principle

After an organizer creates a plan with a place and a start time, anyone with the plan can see those details, until the organizer reschedules or cancels it.

## Types

```types
external User
```

## State

```state
a set of Plans with
  an organizer User
  a title String
  a place String
  a startTime DateTime
  a cancelled Flag
```

## Actions

```actions
create(organizer: User, title: String, place: String, startTime: DateTime) : returns (plan: Plan)
  where startTime is in the future
  then
    creates a plan with these details, not cancelled
    returns plan
  where startTime is not in the future
  then
    refuses START_IN_PAST "Pick a time that hasn't happened yet."

reschedule(organizer: User, plan: Plan, startTime: DateTime) : returns ()
  where plan exists, is not cancelled, and organizer is the plan's organizer
  then
    sets the plan's startTime
    returns
  where plan exists but organizer is not the plan's organizer
  then
    refuses NOT_ORGANIZER "Only the organizer can change the plan."

cancel(organizer: User, plan: Plan) : returns ()
  where plan exists, is not cancelled, and organizer is the plan's organizer
  then
    sets cancelled to true
    returns
  where plan exists but organizer is not the plan's organizer
  then
    refuses NOT_ORGANIZER "Only the organizer can cancel the plan."
```

## Queries

```queries
_details(plan: Plan) : one (organizer: User, title: String, place: String, startTime: DateTime, cancelled: Flag)
  Everything shown in the plan page header.
```

## Notes

Organizer-only edits are enforced here, inside the actions, by taking the acting user as an argument. The reaction layer only has to translate a browser secret into a User (see Identifying) and pass it along. Deleting a plan is intentionally absent: cancelling keeps the history that the on-time record depends on.
