import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import type { ObjectId } from "mongodb";
import { SESSION_COOKIE_NAME, SESSION_TTL_HOURS } from "@/lib/constants";
import {
  createSessionRecord,
  findActiveSessionByTokenHash,
  revokeSessionByTokenHash,
} from "@/repositories/session.repository";
import { findUserById } from "@/repositories/user.repository";
import { isDevBypassEnabled, getDevBypassUser } from "@/lib/dev-bypass";
import type { User } from "@/types/models";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: ObjectId): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await createSessionRecord(userId, tokenHash, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await revokeSessionByTokenHash(hashToken(token));
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  if (isDevBypassEnabled()) {
    return getDevBypassUser();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await findActiveSessionByTokenHash(hashToken(token));
  if (!session) return null;

  const user = await findUserById(session.userId);
  if (!user || !user.isActive) return null;

  return user;
}
