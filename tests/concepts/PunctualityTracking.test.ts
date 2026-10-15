import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { AlreadyRecorded, PunctualityTrackingConcept } from "../../src/concepts/PunctualityTracking.ts";
import { minutes, T0, testDb } from "../db.ts";

let tracking: PunctualityTrackingConcept;
let close: () => Promise<void>;

beforeAll(async () => {
  const t = await testDb("punctualitytracking");
  close = t.close;
  tracking = new PunctualityTrackingConcept(t.db);
});
afterAll(() => close());

describe("PunctualityTracking", () => {
  test("its principle: each arrival becomes minutes late, and the summary counts on-time arrivals", async () => {
    expect(await tracking._summary({ user: "priya", limit: 5 })).toEqual({ onTime: 0, total: 0 });
    expect(await tracking.record({ user: "priya", event: "kbbq", dueAt: T0, arrivedAt: minutes(T0, 9) })).toEqual({
      minutesLate: 9,
    });
    expect(
      await tracking.record({ user: "priya", event: "dimsum", dueAt: minutes(T0, -7 * 24 * 60), arrivedAt: minutes(T0, -7 * 24 * 60 - 3) }),
    ).toEqual({ minutesLate: 0 });
    expect(await tracking._summary({ user: "priya", limit: 5 })).toEqual({ onTime: 1, total: 2 });
    expect(await tracking._recent({ user: "priya", limit: 5 })).toEqual([
      { event: "kbbq", minutesLate: 9 },
      { event: "dimsum", minutesLate: 0 },
    ]);
  });

  test("the limit bounds the summary to the most recent records", async () => {
    expect(await tracking._summary({ user: "priya", limit: 1 })).toEqual({ onTime: 0, total: 1 });
  });

  test("an event is recorded once per person, and early is on time, not negative", async () => {
    await expect(
      tracking.record({ user: "priya", event: "kbbq", dueAt: T0, arrivedAt: T0 }),
    ).rejects.toBeInstanceOf(AlreadyRecorded);
    expect(await tracking.record({ user: "sam", event: "kbbq", dueAt: T0, arrivedAt: minutes(T0, -5) })).toEqual({
      minutesLate: 0,
    });
  });
});
