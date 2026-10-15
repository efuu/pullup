import type { Collection, Db } from "mongodb";
import { instant, isAfter } from "./time.ts";

export class AlreadyOpen extends Error {}
export class NotOpen extends Error {}
export class MaybeClosed extends Error {}

export type Status = "GOING" | "MAYBE" | "NO";

interface EventDoc {
  _id: string;
  decideBy: string;
}

interface ResponseDoc {
  _id: string; // `${user}:${event}`
  user: string;
  event: string;
  status: Status;
  firstAt: string;
  updatedAt: string;
}

export class RSVPingConcept {
  private readonly events: Collection<EventDoc>;
  private readonly responses: Collection<ResponseDoc>;

  constructor(db: Db) {
    this.events = db.collection<EventDoc>("rsvping.events");
    this.responses = db.collection<ResponseDoc>("rsvping.responses");
  }

  async open({ event, decideBy }: { event: string; decideBy: string }) {
    const existing = await this.events.findOne({ _id: event });
    if (existing !== null) throw new AlreadyOpen("Responses are already open for this event.");
    await this.events.insertOne({ _id: event, decideBy: instant(decideBy) });
    return {};
  }

  async #opened(event: string): Promise<EventDoc> {
    const found = await this.events.findOne({ _id: event });
    if (found === null) throw new NotOpen("This event is not taking responses.");
    return found;
  }

  async respond({
    user,
    event,
    status,
    now,
  }: {
    user: string;
    event: string;
    status: Status;
    now: string | Date;
  }) {
    const found = await this.#opened(event);
    const current = instant(now);
    if (status === "MAYBE" && !isAfter(found.decideBy, current)) {
      throw new MaybeClosed("It's past the decide-by time, so pick going or can't.");
    }
    await this.responses.updateOne(
      { _id: `${user}:${event}` },
      {
        $set: { status, updatedAt: current },
        $setOnInsert: { user, event, firstAt: current },
      },
      { upsert: true },
    );
    return {};
  }

  async expireMaybes({ event, now }: { event: string; now: string | Date }) {
    const found = await this.#opened(event);
    if (isAfter(found.decideBy, instant(now))) return { expired: 0 };
    const result = await this.responses.updateMany(
      { event, status: "MAYBE" },
      { $set: { status: "NO", updatedAt: instant(now) } },
    );
    return { expired: result.modifiedCount };
  }

  async _responses({ event }: { event: string }): Promise<Array<{ user: string; status: Status }>> {
    const rows = await this.responses.find({ event }).sort({ firstAt: 1 }).toArray();
    return rows.map(({ user, status }) => ({ user, status }));
  }

  async _decideBy({ event }: { event: string }): Promise<Array<{ decideBy: string }>> {
    const found = await this.events.findOne({ _id: event });
    return found === null ? [] : [{ decideBy: found.decideBy }];
  }

  async _sharedEvents({ user, other }: { user: string; other: string }): Promise<Array<{ event: string }>> {
    const mine = await this.responses.find({ user, status: "GOING" }).sort({ firstAt: 1 }).toArray();
    if (mine.length === 0) return [];
    const theirs = await this.responses
      .find({ user: other, status: "GOING", event: { $in: mine.map((row) => row.event) } })
      .toArray();
    const shared = new Set(theirs.map((row) => row.event));
    return mine.filter((row) => shared.has(row.event)).map(({ event }) => ({ event }));
  }

  async _eventsOf({ user }: { user: string }): Promise<Array<{ event: string; status: Status }>> {
    const rows = await this.responses.find({ user }).sort({ updatedAt: -1 }).toArray();
    return rows.map(({ event, status }) => ({ event, status }));
  }
}
