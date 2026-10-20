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
    expect(await rsvping._decideBy({ event: "kbbq" })).toEqual([{ decideBy, closed: false }]);
    await rsvping.respond({ user: "dylan", event: "kbbq", status: "GOING", now: thursday });
    await rsvping.respond({ user: "kenny", event: "kbbq", status: "MAYBE", now: thursday });
    await rsvping.respond({ user: "alex", event: "kbbq", status: "NO", now: thursday });
    await rsvping.respond({ user: "alex", event: "kbbq", status: "GOING", now: minutes(thursday, 5) });
    expect(await rsvping._responses({ event: "kbbq" })).toEqual([
      { user: "dylan", status: "GOING" },
      { user: "kenny", status: "MAYBE" },
      { user: "alex", status: "GOING" },
    ]);
    // Before the deadline a maybe is an honest "undecided".
    expect((await rsvping._standing({ event: "kbbq", now: minutes(decideBy, -1) }))[1]).toEqual({
      user: "kenny",
      status: "MAYBE",
      lapsed: false,
    });
    // At the deadline Kenny's maybe reads as lapsed, but the answer he gave is kept.
    expect((await rsvping._standing({ event: "kbbq", now: decideBy }))[1]).toEqual({
      user: "kenny",
      status: "MAYBE",
      lapsed: true,
    });
    expect((await rsvping._responses({ event: "kbbq" }))[1]).toEqual({ user: "kenny", status: "MAYBE" });
    // Going and no never lapse.
    expect((await rsvping._standing({ event: "kbbq", now: decideBy })).map((r) => r.lapsed)).toEqual([false, true, false]);
    // A new maybe after the deadline is refused.
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

  test("closing an event stops responses but keeps the ones given", async () => {
    await rsvping.open({ event: "movie", decideBy: minutes(T0, 60) });
    await rsvping.respond({ user: "dylan", event: "movie", status: "GOING", now: thursday });
    await rsvping.close({ event: "movie" });
    expect(await rsvping._decideBy({ event: "movie" })).toEqual([{ decideBy: minutes(T0, 60), closed: true }]);
    await expect(
      rsvping.respond({ user: "kenny", event: "movie", status: "GOING", now: thursday }),
    ).rejects.toBeInstanceOf(NotOpen);
    // the refusal changed nothing
    expect(await rsvping._responses({ event: "movie" })).toEqual([{ user: "dylan", status: "GOING" }]);
    await expect(rsvping.close({ event: "never-opened" })).rejects.toBeInstanceOf(NotOpen);
  });

  test("responses need an open event, and an event opens once", async () => {
    await expect(
      rsvping.respond({ user: "dylan", event: "bowling", status: "GOING", now: thursday }),
    ).rejects.toBeInstanceOf(NotOpen);
    expect(await rsvping._standing({ event: "bowling", now: thursday })).toEqual([]);
    await expect(rsvping.open({ event: "kbbq", decideBy })).rejects.toBeInstanceOf(AlreadyOpen);
    expect(await rsvping._responses({ event: "bowling" })).toEqual([]);
  });
});
