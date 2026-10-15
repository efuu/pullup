# Application types

Every concept that needs a person uses the identity that Identifying hands out, and every concept that needs an event uses a Planning plan. There are no application-specific concrete types: names, titles and places are plain strings owned by the concept that stores them.

```instances
instantiate Identifying

instantiate Planning with
  User is Identifying.User

instantiate RSVPing with
  User is Identifying.User
  Event is Planning.Plan

instantiate ArrivalTracking with
  User is Identifying.User
  Event is Planning.Plan

instantiate PunctualityTracking with
  User is Identifying.User
  Event is Planning.Plan
```
