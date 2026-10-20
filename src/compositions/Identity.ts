/**
 * Who is asking. PullUp has no accounts: a browser claims a name once, keeps
 * the returned secret, and every later request resolves that secret to a user
 * before any other concept is touched.
 */
import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { nameInput, renameInput, secretOnlyInput } from "./validators.ts";

const { Identifying } = concepts;

const Claim = endpoint(
  "/me/claim",
  ({ name, user, secret }) =>
    receive({ name })
      .then(Identifying.claim({ name }).responds({ user, secret }))
      .then(respond({ user, secret })),
  { input: { required: ["name"] }, validators: { input: nameInput } },
);

const Current = endpoint(
  "/me/current",
  ({ secret, user, name }) =>
    receive({ secret })
      .then(Identifying.identify({ secret }).responds({ user }))
      .then(
        where(Identifying._name({ user }).is({ name }))
          .then(respond({ user, name }))
          .named("named"),
      ),
  { input: { required: ["secret"] }, validators: { input: secretOnlyInput } },
);

const Rename = endpoint(
  "/me/rename",
  ({ secret, user, name }) =>
    receive({ secret, name })
      .then(Identifying.identify({ secret }).responds({ user }))
      .then(Identifying.rename({ user, name }).responds({}))
      .then(respond({ user, name })),
  { input: { required: ["secret", "name"] }, validators: { input: renameInput } },
);

export const composition = {
  Claiming: { Claim, Current, Rename },
};
