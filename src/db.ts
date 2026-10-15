import { MongoClient } from "mongodb";

const url = process.env.MONGODB_URL;
if (!url) {
  throw new Error("MONGODB_URL is not set. Copy .env.example to .env.");
}

export const client = new MongoClient(url);
export const db = client.db();
