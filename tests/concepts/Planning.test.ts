import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  InvalidDetails,
  NotOrganizer,
  PlanCancelled,
  PlanningConcept,
  StartInPast,
  UnknownPlan,
} from "../../src/concepts/Planning.ts";
import { minutes, T0, testDb } from "../db.ts";

let planning: PlanningConcept;
let close: () => Promise<void>;
const now = minutes(T0, -24 * 60);

beforeAll(async () => {
  const t = await testDb("planning");
  close = t.close;
  const ids = ["p1", "p2", "p3"];
  planning = new PlanningConcept(t.db, () => ids.shift()!);
});
afterAll(() => close());

describe("Planning", () => {
  test("its principle: create a plan, read its details, only the organizer changes it", async () => {
    expect(
      await planning.create({ organizer: "sam", title: "KBBQ", place: "Koreana", startTime: T0, now }),
    ).toEqual({ plan: "p1" });
    expect(await planning._details({ plan: "p1" })).toEqual([
      { organizer: "sam", title: "KBBQ", place: "Koreana", startTime: T0, cancelled: false },
    ]);
    await expect(
      planning.reschedule({ organizer: "dylan", plan: "p1", startTime: minutes(T0, 30) }),
    ).rejects.toBeInstanceOf(NotOrganizer);
    await planning.reschedule({ organizer: "sam", plan: "p1", startTime: minutes(T0, 30) });
    expect((await planning._details({ plan: "p1" }))[0]?.startTime).toBe(minutes(T0, 30));
    await expect(planning.cancel({ organizer: "dylan", plan: "p1" })).rejects.toBeInstanceOf(NotOrganizer);
    await planning.cancel({ organizer: "sam", plan: "p1" });
    expect((await planning._details({ plan: "p1" }))[0]?.cancelled).toBe(true);
    await expect(planning.cancel({ organizer: "sam", plan: "p1" })).rejects.toBeInstanceOf(PlanCancelled);
  });

  test("a refused reschedule changes nothing, and a cancelled plan cannot be rescheduled", async () => {
    await planning.create({ organizer: "sam", title: "Bowling", place: "Lanes", startTime: T0, now });
    await expect(
      planning.reschedule({ organizer: "nope", plan: "p2", startTime: minutes(T0, 60) }),
    ).rejects.toBeInstanceOf(NotOrganizer);
    expect((await planning._details({ plan: "p2" }))[0]?.startTime).toBe(T0);
    await expect(planning.reschedule({ organizer: "sam", plan: "ghost", startTime: T0 })).rejects.toBeInstanceOf(
      UnknownPlan,
    );
    await planning.cancel({ organizer: "sam", plan: "p2" });
    await expect(
      planning.reschedule({ organizer: "sam", plan: "p2", startTime: minutes(T0, 60) }),
    ).rejects.toBeInstanceOf(PlanCancelled);
  });

  test("refuses blank details, a start in the past, and unknown plans", async () => {
    await expect(
      planning.create({ organizer: "sam", title: " ", place: "Koreana", startTime: T0, now }),
    ).rejects.toBeInstanceOf(InvalidDetails);
    await expect(
      planning.create({ organizer: "sam", title: "KBBQ", place: "Koreana", startTime: now, now }),
    ).rejects.toBeInstanceOf(StartInPast);
    await expect(planning.cancel({ organizer: "sam", plan: "nope" })).rejects.toBeInstanceOf(UnknownPlan);
    expect(await planning._details({ plan: "nope" })).toEqual([]);
  });
});
