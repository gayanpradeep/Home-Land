import { MongoClient, type Db } from "mongodb";

const dbName = process.env.MONGODB_DB_NAME ?? "homelands_rating_db";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.local.example to .env.local and fill it in.");
  }
  const client = new MongoClient(uri, { maxPoolSize: 20 });
  return client.connect();
}

// Reuse a single client across hot reloads and across requests in the same process.
// The client is only constructed on first actual use, so pages that never touch the
// database can still render even if MONGODB_URI is unset.
function getClientPromise(): Promise<MongoClient> {
  return (globalThis._mongoClientPromise ??= createClient());
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}
