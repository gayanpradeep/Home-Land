import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { Session } from "@/types/models";

export async function createSessionRecord(
  userId: ObjectId,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  const db = await getDb();
  await db.collection<Session>(COLLECTIONS.SESSIONS).insertOne({
    userId,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  });
}

export async function findActiveSessionByTokenHash(tokenHash: string): Promise<Session | null> {
  const db = await getDb();
  return db.collection<Session>(COLLECTIONS.SESSIONS).findOne({
    tokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
}

export async function revokeSessionByTokenHash(tokenHash: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<Session>(COLLECTIONS.SESSIONS)
    .updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllSessionsForUser(userId: ObjectId): Promise<void> {
  const db = await getDb();
  await db
    .collection<Session>(COLLECTIONS.SESSIONS)
    .updateMany({ userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
}
