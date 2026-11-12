import { db } from "@/lib/db";
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

export async function findUserByUsername(username: string): Promise<User | null> {
  return db.user.findUnique({ where: { username } });
}

export async function findUserById(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

export async function listUsers(): Promise<User[]> {
  return db.user.findMany({ orderBy: { createdAt: "desc" } });
}

export async function countActiveAdmins(excludeUserId?: string): Promise<number> {
  return db.user.count({
    where: {
      status: "ACTIVE",
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

export async function touchLastLogin(userId: string): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export async function createUser(args: CreateUserArgs): Promise<User> {
  const existing = await findUserByUsername(args.username);
  if (existing) {
    throw new DuplicateUsernameError();
  }

  return db.user.create({
    data: {
      fullName: args.fullName,
      username: args.username,
      passwordHash: args.passwordHash,
      status: args.status,
      mustChangePassword: true,
      lastLoginAt: null,
    },
  });
}

export async function updateUserStatus(userId: string, status: "ACTIVE" | "INACTIVE"): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { status } });
}

export async function updatePasswordHash(
  userId: string,
  passwordHash: string,
  mustChangePassword = false,
): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword } });
}
