import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { AlreadyOpen, MaybeClosed, NotOpen, RSVPingConcept } from "../../src/concepts/RSVPing.ts";
import { minutes, T0, testDb } from "../db.ts";

let rsvping: RSVPingConcept;
let close: () => Promise<void>;
const decideBy = minutes(T0, -240); // 2:00 pm
const thursday = minutes(T0, -2 * 24 * 60);

beforeAll(async () => {
  const t = await testDb("rsvping");
  close = t.close;
  rsvping = new RSVPingConcept(t.db);
});
afterAll(() => close());

describe("RSVPing", () => {
  test("its principle: respond, change your mind, and maybes expire at decide-by", async () => {
    await rsvping.open({ event: "kbbq", decideBy });
    expect(await rsvping._decideBy({ event: "kbbq" })).toEqual([{ decideBy }]);
    await rsvping.respond({ user: "dylan", event: "kbbq", status: "GOING", now: thursday });
    await rsvping.respond({ user: "kenny", event: "kbbq", status: "MAYBE", now: thursday });
    await rsvping.respond({ user: "alex", event: "kbbq", status: "NO", now: thursday });
    await rsvping.respond({ user: "alex", event: "kbbq", status: "GOING", now: minutes(thursday, 5) });
    expect(await rsvping._responses({ event: "kbbq" })).toEqual([
      { user: "dylan", status: "GOING" },
      { user: "kenny", status: "MAYBE" },
      { user: "alex", status: "GOING" },
    ]);
    // Before the deadline nothing expires.
    expect(await rsvping.expireMaybes({ event: "kbbq", now: minutes(decideBy, -1) })).toEqual({ expired: 0 });
    // At the deadline Kenny's maybe becomes a no, and a new maybe is refused.
    expect(await rsvping.expireMaybes({ event: "kbbq", now: decideBy })).toEqual({ expired: 1 });
    expect((await rsvping._responses({ event: "kbbq" }))[1]).toEqual({ user: "kenny", status: "NO" });
    await expect(
      rsvping.respond({ user: "priya", event: "kbbq", status: "MAYBE", now: decideBy }),
    ).rejects.toBeInstanceOf(MaybeClosed);
    // Going and no can still change after the deadline: people really do drop out.
    await rsvping.respond({ user: "alex", event: "kbbq", status: "NO", now: minutes(decideBy, 60) });
    expect(await rsvping._eventsOf({ user: "alex" })).toEqual([{ event: "kbbq", status: "NO" }]);
  });

  test("shared events: both going, in either order, and a person shares with themselves", async () => {
    expect(await rsvping._sharedEvents({ user: "dylan", other: "kenny" })).toEqual([]);
    expect(await rsvping._sharedEvents({ user: "dylan", other: "dylan" })).toEqual([{ event: "kbbq" }]);
    await rsvping.open({ event: "bowling2", decideBy: minutes(T0, 60) });
    await rsvping.respond({ user: "dylan", event: "bowling2", status: "GOING", now: thursday });
    await rsvping.respond({ user: "kenny", event: "bowling2", status: "GOING", now: thursday });
    expect(await rsvping._sharedEvents({ user: "dylan", other: "kenny" })).toEqual([{ event: "bowling2" }]);
    expect(await rsvping._sharedEvents({ user: "kenny", other: "dylan" })).toEqual([{ event: "bowling2" }]);
  });

  test("responses need an open event, and an event opens once", async () => {
    await expect(
      rsvping.respond({ user: "dylan", event: "bowling", status: "GOING", now: thursday }),
    ).rejects.toBeInstanceOf(NotOpen);
    await expect(rsvping.expireMaybes({ event: "bowling", now: thursday })).rejects.toBeInstanceOf(NotOpen);
    await expect(rsvping.open({ event: "kbbq", decideBy })).rejects.toBeInstanceOf(AlreadyOpen);
    expect(await rsvping._responses({ event: "bowling" })).toEqual([]);
  });
});
