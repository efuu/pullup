# Plans

Everything on the plan page goes through this module. Every endpoint resolves the
browser's secret to a user before touching any other concept.

## Creating

An identified user [creates a plan](reaction:Plans.Creating.CreatePlan) with a title,
place, start time and decide-by time. The endpoint creates the plan and opens
responses for it with that decide-by time. Opening responses is what makes
[the organizer count as going](reaction:Plans.Creating.OrganizerIsGoing): a reaction
on the open looks up the plan's organizer and records a GOING response for them, so an
organizer never has to RSVP to their own plan.

```endpoints
Plans.Creating.CreatePlan at /plans/create
```

## Viewing

[Viewing a plan](reaction:Plans.Viewing.ViewPlan) reads the plan as of the moment of
the request and changes nothing. The response is [the plan page](former:Plans.Viewing.PlanPage):
the plan's details and decide-by time, every response with the responder's name,
on-time summary, and whether a maybe has lapsed (the decide-by time passed and the
person never decided, so they are not counted as coming, though their answer is kept
as the maybe they gave), and the arrival board split into who is on the way and who is
here. Reading the deadline rather than enforcing it by rewriting answers is a
deliberate choice: what someone said is useful information even after the time to say
it has passed.

```endpoints
Plans.Viewing.ViewPlan at /plans/view
```

A user can also [list their plans](reaction:Plans.Viewing.MyPlans), formed by
[the plan list](former:Plans.Viewing.PlanList) from every event they have responded
to, joined to that plan's details.

```endpoints
Plans.Viewing.MyPlans at /plans/mine
```

## Responding and managing

An identified user [responds going, maybe or no](reaction:Plans.Responding.Respond).
RSVPing itself refuses a maybe after the decide-by time.

```endpoints
Plans.Responding.Respond at /plans/respond
```

Only the organizer can [reschedule a plan](reaction:Plans.Managing.ReschedulePlan) or
[cancel it](reaction:Plans.Managing.CancelPlan); each endpoint passes the resolved user
as the claimed organizer and Planning refuses anyone else. Cancelling a plan
[closes its responses](reaction:Plans.Managing.CancelClosesResponses), so nobody can
RSVP to a plan that is off, while the responses already given stay on the page.

```endpoints
Plans.Managing.ReschedulePlan at /plans/reschedule
Plans.Managing.CancelPlan at /plans/cancel
```

## Arriving

On the day, a user says they are [pulling up](reaction:Plans.Arriving.Leave) with an
estimate in minutes, can [correct the estimate](reaction:Plans.Arriving.UpdateEta) while
on the way, and says when they have [pulled up](reaction:Plans.Arriving.Arrive).
Arriving is what [writes the on-time record](reaction:Plans.Arriving.RecordArrival): a
reaction on the arrival looks up the plan's start time and hands both instants to
PunctualityTracking, which decides how late that was. Neither ArrivalTracking nor
PunctualityTracking knows about the other.

```endpoints
Plans.Arriving.Leave at /plans/leave
Plans.Arriving.UpdateEta at /plans/eta
Plans.Arriving.Arrive at /plans/arrive
```
