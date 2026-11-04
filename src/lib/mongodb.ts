import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? "homelands_rating_db";

if (!uri) {
  throw new Error("MONGODB_URI is not set. Copy .env.local.example to .env.local and fill it in.");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClient(): Promise<MongoClient> {
  const client = new MongoClient(uri as string, {
    maxPoolSize: 20,
  });
  return client.connect();
}

// Reuse a single client across hot reloads and across requests in the same process.
const clientPromise: Promise<MongoClient> = (globalThis._mongoClientPromise ??= createClient());

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;
