import type { Collection, Db } from "mongodb";

export class InvalidName extends Error {}
export class UnknownSecret extends Error {}
export class UnknownUser extends Error {}

interface UserDoc {
  _id: string;
  name: string;
  secret: string;
}

function acceptedName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 40) {
    throw new InvalidName("Enter a name of at most 40 characters.");
  }
  return trimmed;
}

export class IdentifyingConcept {
  private readonly users: Collection<UserDoc>;
  private indexed = false;

  constructor(
    db: Db,
    private readonly freshId: () => string = () => crypto.randomUUID(),
    private readonly freshSecret: () => string = () => crypto.randomUUID() + crypto.randomUUID(),
  ) {
    this.users = db.collection<UserDoc>("identifying.users");
  }

  async #ensureIndex() {
    if (this.indexed) return;
    await this.users.createIndex({ secret: 1 }, { unique: true });
    this.indexed = true;
  }

  async claim({ name }: { name: string }) {
    await this.#ensureIndex();
    const accepted = acceptedName(name);
    const user = this.freshId();
    const secret = this.freshSecret();
    await this.users.insertOne({ _id: user, name: accepted, secret });
    return { user, secret };
  }

  async identify({ secret }: { secret: string }) {
    const found = await this.users.findOne({ secret });
    if (found === null) {
      throw new UnknownSecret("This browser is not recognized. Enter your name again.");
    }
    return { user: found._id };
  }

  async rename({ user, name }: { user: string; name: string }) {
    const accepted = acceptedName(name);
    const result = await this.users.updateOne({ _id: user }, { $set: { name: accepted } });
    if (result.matchedCount === 0) throw new UnknownUser("There is no such user.");
    return {};
  }

  async _name({ user }: { user: string }): Promise<Array<{ name: string }>> {
    const found = await this.users.findOne({ _id: user });
    return found === null ? [] : [{ name: found.name }];
  }
}
