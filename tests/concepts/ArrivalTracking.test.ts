import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  AlreadyArrived,
  AlreadyLeft,
  ArrivalTrackingConcept,
  InvalidEta,
  NotOnTheWay,
} from "../../src/concepts/ArrivalTracking.ts";
import { minutes, T0, testDb } from "../db.ts";

let tracking: ArrivalTrackingConcept;
let close: () => Promise<void>;

beforeAll(async () => {
  const t = await testDb("arrivaltracking");
  close = t.close;
  tracking = new ArrivalTrackingConcept(t.db);
});
afterAll(() => close());

describe("ArrivalTracking", () => {
  test("its principle: not left, then on the way, then here", async () => {
    expect(await tracking._onTheWay({ event: "kbbq" })).toEqual([]);
    await tracking.leave({ user: "priya", event: "kbbq", etaMinutes: 8, now: minutes(T0, -10) });
    expect(await tracking._onTheWay({ event: "kbbq" })).toEqual([
      { user: "priya", leftAt: minutes(T0, -10), etaMinutes: 8 },
    ]);
    await tracking.updateEta({ user: "priya", event: "kbbq", etaMinutes: 12 });
    expect((await tracking._onTheWay({ event: "kbbq" }))[0]?.etaMinutes).toBe(12);
    expect(await tracking.arrive({ user: "priya", event: "kbbq", now: minutes(T0, 9) })).toEqual({
      arrivedAt: minutes(T0, 9),
    });
    expect(await tracking._onTheWay({ event: "kbbq" })).toEqual([]);
    expect(await tracking._arrived({ event: "kbbq" })).toEqual([
      { user: "priya", leftAt: minutes(T0, -10), arrivedAt: minutes(T0, 9) },
    ]);
  });

  test("arriving without ever leaving is allowed; arriving twice is not", async () => {
    await tracking.arrive({ user: "sam", event: "kbbq", now: minutes(T0, 1) });
    expect((await tracking._arrived({ event: "kbbq" })).map((r) => r.user)).toEqual(["sam", "priya"]);
    await expect(tracking.arrive({ user: "sam", event: "kbbq", now: minutes(T0, 2) })).rejects.toBeInstanceOf(
      AlreadyArrived,
    );
    await expect(
      tracking.leave({ user: "sam", event: "kbbq", etaMinutes: 1, now: minutes(T0, 2) }),
    ).rejects.toBeInstanceOf(AlreadyLeft);
  });

  test("refuses bad estimates and ETA updates for people not on the way", async () => {
    await expect(
      tracking.leave({ user: "jordan", event: "kbbq", etaMinutes: -1, now: T0 }),
    ).rejects.toBeInstanceOf(InvalidEta);
    await expect(tracking.updateEta({ user: "jordan", event: "kbbq", etaMinutes: 5 })).rejects.toBeInstanceOf(
      NotOnTheWay,
    );
    await expect(tracking.updateEta({ user: "priya", event: "kbbq", etaMinutes: 5 })).rejects.toBeInstanceOf(
      NotOnTheWay,
    );
  });
});
