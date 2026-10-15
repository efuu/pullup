import type { Collection, Db } from "mongodb";
import { instant } from "./time.ts";

export class AlreadyRecorded extends Error {}

interface RecordDoc {
  _id: string; // `${user}:${event}`
  user: string;
  event: string;
  minutesLate: number;
  recordedAt: string;
}

export class PunctualityTrackingConcept {
  private readonly records: Collection<RecordDoc>;

  constructor(db: Db) {
    this.records = db.collection<RecordDoc>("punctualitytracking.records");
  }

  async record({
    user,
    event,
    dueAt,
    arrivedAt,
  }: {
    user: string;
    event: string;
    dueAt: string | Date;
    arrivedAt: string | Date;
  }) {
    const existing = await this.records.findOne({ _id: `${user}:${event}` });
    if (existing !== null) throw new AlreadyRecorded("Arrival already recorded.");
    const due = new Date(instant(dueAt)).getTime();
    const arrived = new Date(instant(arrivedAt)).getTime();
    const minutesLate = Math.max(0, Math.floor((arrived - due) / 60_000));
    await this.records.insertOne({
      _id: `${user}:${event}`,
      user,
      event,
      minutesLate,
      recordedAt: instant(arrivedAt),
    });
    return { minutesLate };
  }

  async #recent(user: string, limit: number): Promise<RecordDoc[]> {
    const count = Math.max(1, Math.min(50, Math.floor(limit)));
    return this.records.find({ user }).sort({ recordedAt: -1 }).limit(count).toArray();
  }

  async _recent({
    user,
    limit,
  }: {
    user: string;
    limit: number;
  }): Promise<Array<{ event: string; minutesLate: number }>> {
    const rows = await this.#recent(user, limit);
    return rows.map(({ event, minutesLate }) => ({ event, minutesLate }));
  }

  async _summary({
    user,
    limit,
  }: {
    user: string;
    limit: number;
  }): Promise<{ onTime: number; total: number }> {
    // A `one` query answers a single record, not a one-element array.
    const rows = await this.#recent(user, limit);
    return { onTime: rows.filter((row) => row.minutesLate === 0).length, total: rows.length };
  }
}
