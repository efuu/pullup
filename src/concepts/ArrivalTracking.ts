import type { Collection, Db } from "mongodb";
import { instant } from "./time.ts";

export class InvalidEta extends Error {}
export class AlreadyLeft extends Error {}
export class NotOnTheWay extends Error {}
export class AlreadyArrived extends Error {}

interface StatusDoc {
  _id: string; // `${user}:${event}`
  user: string;
  event: string;
  leftAt: string;
  etaMinutes: number;
  arrived: boolean;
  arrivedAt: string;
}

function acceptedEta(etaMinutes: number): number {
  if (!Number.isFinite(etaMinutes) || etaMinutes < 0 || etaMinutes > 600) {
    throw new InvalidEta("Give an estimate between 0 and 600 minutes.");
  }
  return Math.round(etaMinutes);
}

export class ArrivalTrackingConcept {
  private readonly statuses: Collection<StatusDoc>;

  constructor(db: Db) {
    this.statuses = db.collection<StatusDoc>("arrivaltracking.statuses");
  }

  async leave({
    user,
    event,
    etaMinutes,
    now,
  }: {
    user: string;
    event: string;
    etaMinutes: number;
    now: string | Date;
  }) {
    const eta = acceptedEta(etaMinutes);
    const existing = await this.statuses.findOne({ _id: `${user}:${event}` });
    if (existing !== null) throw new AlreadyLeft("You already said you left.");
    const current = instant(now);
    await this.statuses.insertOne({
      _id: `${user}:${event}`,
      user,
      event,
      leftAt: current,
      etaMinutes: eta,
      arrived: false,
      arrivedAt: current,
    });
    return {};
  }

  async updateEta({ user, event, etaMinutes }: { user: string; event: string; etaMinutes: number }) {
    const eta = acceptedEta(etaMinutes);
    const existing = await this.statuses.findOne({ _id: `${user}:${event}` });
    if (existing === null || existing.arrived) throw new NotOnTheWay("Say you're leaving first.");
    await this.statuses.updateOne({ _id: existing._id }, { $set: { etaMinutes: eta } });
    return {};
  }

  async arrive({ user, event, now }: { user: string; event: string; now: string | Date }) {
    const current = instant(now);
    const existing = await this.statuses.findOne({ _id: `${user}:${event}` });
    if (existing !== null && existing.arrived) {
      throw new AlreadyArrived("You're already marked as here.");
    }
    if (existing === null) {
      await this.statuses.insertOne({
        _id: `${user}:${event}`,
        user,
        event,
        leftAt: current,
        etaMinutes: 0,
        arrived: true,
        arrivedAt: current,
      });
    } else {
      await this.statuses.updateOne(
        { _id: existing._id },
        { $set: { arrived: true, arrivedAt: current } },
      );
    }
    return { arrivedAt: current };
  }

  async _onTheWay({
    event,
  }: {
    event: string;
  }): Promise<Array<{ user: string; leftAt: string; etaMinutes: number }>> {
    const rows = await this.statuses.find({ event, arrived: false }).sort({ leftAt: 1 }).toArray();
    return rows.map(({ user, leftAt, etaMinutes }) => ({ user, leftAt, etaMinutes }));
  }

  async _arrived({
    event,
  }: {
    event: string;
  }): Promise<Array<{ user: string; leftAt: string; arrivedAt: string }>> {
    const rows = await this.statuses.find({ event, arrived: true }).sort({ arrivedAt: 1 }).toArray();
    return rows.map(({ user, leftAt, arrivedAt }) => ({ user, leftAt, arrivedAt }));
  }
}
