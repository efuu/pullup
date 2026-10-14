# Identifying

## Purpose

Tell returning visitors apart without accounts, so that a name on a plan refers to the same person the next time.

## Principle

A visitor gives a name once and receives a secret. Presenting the secret later identifies them as the same user, so their responses, statuses and record accumulate across plans.

## Types

```types
```

## State

```state
a set of Users with
  a name String
  a unique secret String
```

## Actions

```actions
claim(name: String) : returns (user: User, secret: String)
  where name is not empty
  then
    creates a user with this name and a fresh unguessable secret
    returns user and secret
  where name is empty
  then
    refuses EMPTY_NAME "Enter a name."

identify(secret: String) : returns (user: User)
  where a user has this secret
  then
    returns that user
  where no user has this secret
  then
    refuses UNKNOWN_SECRET "Not recognized."

rename(user: User, name: String) : returns ()
  where user exists and name is not empty
  then
    sets the user's name
    returns
  where name is empty
  then
    refuses EMPTY_NAME "Enter a name."
```

## Queries

```queries
_name(user: User) : one (name: String)
  The user's current display name.
```

## Notes

Deliberately not a password login. The pitch depends on "a link and a name," and asking invitees to register would be the friction that makes the group not adopt it. The secret lives in the browser (a cookie), so a new device means a new identity; moving an identity to another device is out of scope for now. Name collisions across groups are fine because identity is the secret, not the name.
