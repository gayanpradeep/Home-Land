import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { User } from "@/types/models";

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>(COLLECTIONS.USERS).findOne({ email });
}

export async function findUserById(id: ObjectId | string): Promise<User | null> {
  const db = await getDb();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  return db.collection<User>(COLLECTIONS.USERS).findOne({ _id });
}

export async function touchLastLogin(userId: ObjectId): Promise<void> {
  const db = await getDb();
  await db
    .collection<User>(COLLECTIONS.USERS)
    .updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
}

export async function updatePasswordHash(userId: ObjectId, passwordHash: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<User>(COLLECTIONS.USERS)
    .updateOne({ _id: userId }, { $set: { passwordHash, updatedAt: new Date() } });
}
