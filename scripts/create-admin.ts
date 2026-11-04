import "dotenv/config";
import argon2 from "argon2";
import { MongoClient } from "mongodb";
import { COLLECTIONS } from "../src/lib/constants";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "homelands_rating_db";
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!uri) throw new Error("MONGODB_URI is not set in .env.local");
  if (!email || !password) {
    throw new Error(
      "Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in .env.local before running this script.",
    );
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date();

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const existing = await db.collection(COLLECTIONS.USERS).findOne({ email });
  if (existing) {
    console.log(`User ${email} already exists. No changes made.`);
    await client.close();
    return;
  }

  await db.collection(COLLECTIONS.USERS).insertOne({
    email,
    passwordHash,
    fullName: "Head Office Administrator",
    role: "HEAD_OFFICE_ADMIN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Head Office Admin created: ${email}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
