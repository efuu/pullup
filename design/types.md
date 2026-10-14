# Types

```types
concrete DateTime
  A point in time.
```

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
