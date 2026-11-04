import { getDb, tsToDate } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { User } from "@/types/models";

export interface CreateUserArgs {
  fullName: string;
  username: string;
  passwordHash: string;
  status: "ACTIVE" | "INACTIVE";
}

export class DuplicateUsernameError extends Error {
  constructor() {
    super("Username is already taken.");
  }
}

function fromDoc(doc: FirebaseFirestore.DocumentSnapshot): User {
  const data = doc.data() as Omit<User, "id" | "createdAt" | "updatedAt" | "lastLoginAt"> & {
    createdAt: unknown;
    updatedAt: unknown;
    lastLoginAt: unknown;
  };
  return {
    ...data,
    id: doc.id,
    createdAt: tsToDate(data.createdAt) ?? new Date(0),
    updatedAt: tsToDate(data.updatedAt) ?? new Date(0),
    lastLoginAt: tsToDate(data.lastLoginAt),
  };
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.USERS).where("username", "==", username).limit(1).get();
  return snapshot.empty ? null : fromDoc(snapshot.docs[0]);
}

export async function findUserById(id: string): Promise<User | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.USERS).doc(id).get();
  return doc.exists ? fromDoc(doc) : null;
}

export async function listUsers(): Promise<User[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.USERS).orderBy("createdAt", "desc").get();
  return snapshot.docs.map(fromDoc);
}

export async function countActiveAdmins(excludeUserId?: string): Promise<number> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.USERS).where("status", "==", "ACTIVE").get();
  return snapshot.docs.filter((doc) => doc.id !== excludeUserId).length;
}

export async function touchLastLogin(userId: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.USERS).doc(userId).update({ lastLoginAt: new Date() });
}

export async function createUser(args: CreateUserArgs): Promise<User> {
  const db = getDb();
  const existing = await findUserByUsername(args.username);
  if (existing) {
    throw new DuplicateUsernameError();
  }

  const now = new Date();
  const doc = {
    fullName: args.fullName,
    username: args.username,
    passwordHash: args.passwordHash,
    status: args.status,
    mustChangePassword: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTIONS.USERS).add(doc);
  return { ...doc, id: ref.id };
}

export async function updateUserStatus(userId: string, status: "ACTIVE" | "INACTIVE"): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.USERS).doc(userId).update({ status, updatedAt: new Date() });
}

export async function updatePasswordHash(
  userId: string,
  passwordHash: string,
  mustChangePassword = false,
): Promise<void> {
  const db = getDb();
  await db
    .collection(COLLECTIONS.USERS)
    .doc(userId)
    .update({ passwordHash, mustChangePassword, updatedAt: new Date() });
}
