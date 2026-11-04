import { config } from "dotenv";
config({ path: ".env.local" });
import argon2 from "argon2";
import { getDb } from "../src/lib/firebase";
import { COLLECTIONS } from "../src/lib/constants";

const DEV_DEFAULT_USERNAME = "admin";
const DEV_DEFAULT_PASSWORD = "admin123";

async function main() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME ?? DEV_DEFAULT_USERNAME;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? DEV_DEFAULT_PASSWORD;

  if (!process.env.BOOTSTRAP_ADMIN_USERNAME || !process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    console.warn(
      "WARNING: BOOTSTRAP_ADMIN_USERNAME/PASSWORD not set — using dev defaults " +
        `(${DEV_DEFAULT_USERNAME} / ${DEV_DEFAULT_PASSWORD}). Never use these in production.`,
    );
  }

  const db = getDb();
  const now = new Date();

  const existing = await db.collection(COLLECTIONS.USERS).limit(1).get();

  if (!existing.empty) {
    console.log("An admin account already exists. No changes made.");
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await db.collection(COLLECTIONS.USERS).add({
    fullName: "System Administrator",
    username,
    passwordHash,
    status: "ACTIVE",
    mustChangePassword: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Initial Admin created: ${username} (must change password on first login).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
