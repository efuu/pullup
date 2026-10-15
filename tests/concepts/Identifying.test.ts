import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { IdentifyingConcept, InvalidName, UnknownSecret, UnknownUser } from "../../src/concepts/Identifying.ts";
import { testDb } from "../db.ts";

let identifying: IdentifyingConcept;
let close: () => Promise<void>;

beforeAll(async () => {
  const t = await testDb("identifying");
  close = t.close;
  const ids = ["u1", "u2"];
  const secrets = ["s1", "s2"];
  identifying = new IdentifyingConcept(t.db, () => ids.shift()!, () => secrets.shift()!);
});
afterAll(() => close());

describe("Identifying", () => {
  test("its principle: claim a name once, then the secret identifies the same user", async () => {
    expect(await identifying.claim({ name: "Sam" })).toEqual({ user: "u1", secret: "s1" });
    expect(await identifying.identify({ secret: "s1" })).toEqual({ user: "u1" });
    expect(await identifying.identify({ secret: "s1" })).toEqual({ user: "u1" });
    expect(await identifying._name({ user: "u1" })).toEqual([{ name: "Sam" }]);
  });

  test("two people with the same name are different users", async () => {
    expect(await identifying.claim({ name: "Sam" })).toEqual({ user: "u2", secret: "s2" });
    expect(await identifying.identify({ secret: "s2" })).toEqual({ user: "u2" });
  });

  test("an unknown secret is refused and an unknown user has no name", async () => {
    await expect(identifying.identify({ secret: "nope" })).rejects.toBeInstanceOf(UnknownSecret);
    expect(await identifying._name({ user: "ghost" })).toEqual([]);
  });

  test("blank or long names are refused; rename keeps identity", async () => {
    await expect(identifying.claim({ name: "   " })).rejects.toBeInstanceOf(InvalidName);
    await expect(identifying.claim({ name: "x".repeat(41) })).rejects.toBeInstanceOf(InvalidName);
    await identifying.rename({ user: "u1", name: "Sam W" });
    expect(await identifying._name({ user: "u1" })).toEqual([{ name: "Sam W" }]);
    expect(await identifying.identify({ secret: "s1" })).toEqual({ user: "u1" });
    await expect(identifying.rename({ user: "ghost", name: "x" })).rejects.toBeInstanceOf(UnknownUser);
  });
});
