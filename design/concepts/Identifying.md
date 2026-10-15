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
  where name is blank or longer than 40 characters
  then
    refuses INVALID_NAME "Enter a name of at most 40 characters."
  where name is accepted
  then
    add a new user with name and a fresh unguessable secret
    returns user, secret

identify(secret: String) : returns (user: User)
  where no user has this secret
  then
    refuses UNKNOWN_SECRET "This browser is not recognized. Enter your name again."
  where a user has this secret
  then
    bind user to that user
    returns user

rename(user: User, name: String) : returns ()
  where user is unknown
  then
    refuses UNKNOWN_USER "There is no such user."
  where name is blank or longer than 40 characters
  then
    refuses INVALID_NAME "Enter a name of at most 40 characters."
  where user is known and name is accepted
  then
    set the user's name to name
    returns
```

## Queries

```queries
_name(user: User) : optional (name: String)
  Answers the user's current display name, and no row for an unknown user.
```
