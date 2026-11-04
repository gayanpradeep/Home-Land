import "dotenv/config";
import argon2 from "argon2";
import { MongoClient } from "mongodb";
import { COLLECTIONS } from "../src/lib/constants";

const DEV_DEFAULT_USERNAME = "admin";
const DEV_DEFAULT_PASSWORD = "admin123";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "homelands_rating_db";
  if (!uri) throw new Error("MONGODB_URI is not set in .env.local");

  const username = process.env.BOOTSTRAP_ADMIN_USERNAME ?? DEV_DEFAULT_USERNAME;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? DEV_DEFAULT_PASSWORD;

  if (!process.env.BOOTSTRAP_ADMIN_USERNAME || !process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    console.warn(
      "WARNING: BOOTSTRAP_ADMIN_USERNAME/PASSWORD not set — using dev defaults " +
        `(${DEV_DEFAULT_USERNAME} / ${DEV_DEFAULT_PASSWORD}). Never use these in production.`,
    );
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date();

  const anyAdminExists = await db
    .collection(COLLECTIONS.USERS)
    .findOne({ userType: "ADMIN" });

  if (anyAdminExists) {
    console.log("An Admin account already exists. No changes made.");
    await client.close();
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await db.collection(COLLECTIONS.USERS).insertOne({
    fullName: "System Administrator",
    username,
    passwordHash,
    userType: "ADMIN",
    branchId: null,
    departmentId: null,
    status: "ACTIVE",
    mustChangePassword: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Initial Admin created: ${username} (must change password on first login).`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
