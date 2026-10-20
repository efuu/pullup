import type { Collection, Db } from "mongodb";
import { instant, isAfter } from "./time.ts";

export class InvalidDetails extends Error {}
export class StartInPast extends Error {}
export class UnknownPlan extends Error {}
export class NotOrganizer extends Error {}
export class PlanCancelled extends Error {}

interface PlanDoc {
  _id: string;
  organizer: string;
  title: string;
  place: string;
  startTime: string;
  cancelled: boolean;
  createdAt: string;
}

export class PlanningConcept {
  private readonly plans: Collection<PlanDoc>;

  constructor(
    db: Db,
    private readonly freshId: () => string = () => crypto.randomUUID(),
  ) {
    this.plans = db.collection<PlanDoc>("planning.plans");
  }

  async create({
    organizer,
    title,
    place,
    startTime,
    now,
  }: {
    organizer: string;
    title: string;
    place: string;
    startTime: string;
    now: string | Date;
  }) {
    const cleanTitle = title.trim();
    const cleanPlace = place.trim();
    if (!cleanTitle || !cleanPlace || cleanTitle.length > 80 || cleanPlace.length > 80) {
      throw new InvalidDetails("Give the plan a title and a place, each at most 80 characters.");
    }
    const start = instant(startTime);
    const current = instant(now);
    if (!isAfter(start, current)) {
      throw new StartInPast("Pick a start time that hasn't happened yet.");
    }
    const plan = this.freshId();
    await this.plans.insertOne({
      _id: plan,
      organizer,
      title: cleanTitle,
      place: cleanPlace,
      startTime: start,
      cancelled: false,
      createdAt: current,
    });
    return { plan };
  }

  async #owned(plan: string, organizer: string, verb: string): Promise<PlanDoc> {
    const found = await this.plans.findOne({ _id: plan });
    if (found === null) throw new UnknownPlan("There is no such plan.");
    if (found.organizer !== organizer) {
      throw new NotOrganizer(`Only the organizer can ${verb} the plan.`);
    }
    return found;
  }

  async reschedule({
    organizer,
    plan,
    startTime,
  }: {
    organizer: string;
    plan: string;
    startTime: string;
  }) {
    const found = await this.#owned(plan, organizer, "change");
    if (found.cancelled) throw new PlanCancelled("This plan was cancelled.");
    await this.plans.updateOne({ _id: plan }, { $set: { startTime: instant(startTime) } });
    return {};
  }

  async cancel({ organizer, plan }: { organizer: string; plan: string }) {
    const found = await this.#owned(plan, organizer, "cancel");
    if (found.cancelled) throw new PlanCancelled("This plan was already cancelled.");
    await this.plans.updateOne({ _id: plan }, { $set: { cancelled: true } });
    return {};
  }

  async _details({ plan }: { plan: string }): Promise<
    Array<{ organizer: string; title: string; place: string; startTime: string; cancelled: boolean }>
  > {
    const found = await this.plans.findOne({ _id: plan });
    if (found === null) return [];
    const { organizer, title, place, startTime, cancelled } = found;
    return [{ organizer, title, place, startTime, cancelled }];
  }
}
