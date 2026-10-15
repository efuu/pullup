# Planning

## Purpose

Let one person propose a specific outing (what, where, when) that everyone else can refer to.

## Principle

After an organizer creates a plan with a place and a start time, anyone with the plan can read those details, until the organizer reschedules or cancels it. Only the organizer can change or cancel it.

## Types

```types
external User
  The person who organizes a plan.
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
create(organizer: User, title: String, place: String, startTime: DateTime, now: DateTime) : returns (plan: Plan)
  where title or place is blank, or either is longer than 80 characters
  then
    refuses INVALID_DETAILS "Give the plan a title and a place, each at most 80 characters."
  where startTime is not after now
  then
    refuses START_IN_PAST "Pick a start time that hasn't happened yet."
  where the details are accepted
  then
    add a new plan with organizer, title, place, startTime, and cancelled false
    returns plan

reschedule(organizer: User, plan: Plan, startTime: DateTime) : returns ()
  where plan is unknown
  then
    refuses UNKNOWN_PLAN "There is no such plan."
  where organizer is not the plan's organizer
  then
    refuses NOT_ORGANIZER "Only the organizer can change the plan."
  where plan is cancelled
  then
    refuses PLAN_CANCELLED "This plan was cancelled."
  where plan is known, not cancelled, and organizer is its organizer
  then
    set the plan's startTime to startTime
    returns

cancel(organizer: User, plan: Plan) : returns ()
  where plan is unknown
  then
    refuses UNKNOWN_PLAN "There is no such plan."
  where organizer is not the plan's organizer
  then
    refuses NOT_ORGANIZER "Only the organizer can cancel the plan."
  where plan is cancelled
  then
    refuses PLAN_CANCELLED "This plan was already cancelled."
  where plan is known, not cancelled, and organizer is its organizer
  then
    set cancelled to true
    returns
```

## Queries

```queries
_details(plan: Plan) : optional (organizer: User, title: String, place: String, startTime: DateTime, cancelled: Flag)
  Answers the plan's current details, and no row for an unknown plan.
```
