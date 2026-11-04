import "dotenv/config";
import { MongoClient } from "mongodb";
import { COLLECTIONS } from "../src/lib/constants";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "homelands_rating_db";
  if (!uri) throw new Error("MONGODB_URI is not set in .env.local");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  await db.collection(COLLECTIONS.BRANCHES).createIndex({ branchCode: 1 }, { unique: true });

  await db.collection(COLLECTIONS.USERS).createIndex({ username: 1 }, { unique: true });

  await db
    .collection(COLLECTIONS.DEPARTMENTS)
    .createIndex({ branchId: 1, departmentCode: 1 }, { unique: true });

  await db.collection(COLLECTIONS.DEVICES).createIndex({ deviceCode: 1 }, { unique: true });
  await db
    .collection(COLLECTIONS.DEVICES)
    .createIndex({ branchId: 1, departmentId: 1, status: 1 });

  await db
    .collection(COLLECTIONS.RATINGS)
    .createIndex({ branchId: 1, submittedAt: -1 });
  await db
    .collection(COLLECTIONS.RATINGS)
    .createIndex({ departmentId: 1, submittedAt: -1 });
  await db
    .collection(COLLECTIONS.RATINGS)
    .createIndex({ deviceId: 1, submittedAt: -1 });
  await db.collection(COLLECTIONS.RATINGS).createIndex({ submittedAt: -1 });
  await db
    .collection(COLLECTIONS.RATINGS)
    .createIndex({ submissionReference: 1 }, { unique: true });

  await db
    .collection(COLLECTIONS.DAILY_SUMMARIES)
    .createIndex({ branchId: 1, departmentId: 1, dateKey: 1 }, { unique: true });

  await db.collection(COLLECTIONS.SESSIONS).createIndex({ tokenHash: 1 }, { unique: true });
  await db.collection(COLLECTIONS.SESSIONS).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await db.collection(COLLECTIONS.FEEDBACK).createIndex({ ratingId: 1 });
  await db.collection(COLLECTIONS.AUDIT_LOGS).createIndex({ createdAt: -1 });

  console.log("Indexes created successfully.");
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
