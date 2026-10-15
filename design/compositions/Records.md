# Records

A person's on-time record is visible only to people who have shared a plan with them.
[Viewing a record](reaction:Records.Viewing.ViewRecord) resolves the viewer from their
secret and then requires that [the viewer and the target share a plan](view:Records.Viewing.sharesAPlan):
some event both of them responded GOING to. Only then is
[the record card](former:Records.Viewing.RecordCard) formed, with the target's name,
their on-time summary over the last five plans, and each of those plans with its title
and how late they were. A viewer who has never shared a plan with the target gets a
NOT_SHARED error and no data. The rule lives here, in composition, so
PunctualityTracking stays a plain store of facts.

```endpoints
Records.Viewing.ViewRecord at /records/view
```
