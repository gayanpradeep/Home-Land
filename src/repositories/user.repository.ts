import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { User } from "@/types/models";

export async function findUserByUsername(username: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>(COLLECTIONS.USERS).findOne({ username });
}

export async function findUserById(id: ObjectId | string): Promise<User | null> {
  const db = await getDb();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  return db.collection<User>(COLLECTIONS.USERS).findOne({ _id });
}

export async function listUsers(): Promise<User[]> {
  const db = await getDb();
  return db.collection<User>(COLLECTIONS.USERS).find({}).sort({ createdAt: -1 }).toArray();
}

export async function countActiveAdmins(excludeUserId?: ObjectId): Promise<number> {
  const db = await getDb();
  const filter: Record<string, unknown> = { userType: "ADMIN", status: "ACTIVE" };
  if (excludeUserId) filter._id = { $ne: excludeUserId };
  return db.collection<User>(COLLECTIONS.USERS).countDocuments(filter);
}

export async function touchLastLogin(userId: ObjectId): Promise<void> {
  const db = await getDb();
  await db
    .collection<User>(COLLECTIONS.USERS)
    .updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
}

export async function updatePasswordHash(
  userId: ObjectId,
  passwordHash: string,
  mustChangePassword = false,
): Promise<void> {
  const db = await getDb();
  await db
    .collection<User>(COLLECTIONS.USERS)
    .updateOne({ _id: userId }, { $set: { passwordHash, mustChangePassword, updatedAt: new Date() } });
}
