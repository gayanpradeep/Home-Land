import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_TTL_HOURS } from "@/lib/constants";
import {
  createSessionRecord,
  findActiveSessionByTokenHash,
  revokeSessionByTokenHash,
} from "@/repositories/session.repository";
import { findUserById } from "@/repositories/user.repository";
import { isDevBypassEnabled, getDevBypassUser, DEV_BYPASS_SESSION_COOKIE } from "@/lib/dev-bypass";
import type { User } from "@/types/models";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Behind a reverse proxy, the connection to Nginx is always plain HTTP even
// when the browser is on HTTPS, so NODE_ENV can't tell us which one it was —
// trust X-Forwarded-Proto (set by nginx/proxy-params.conf) instead.
export function isHttpsRequest(request: Request): boolean {
  return request.headers.get("x-forwarded-proto") === "https";
}

export async function createSession(userId: string, secure: boolean): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await createSessionRecord(userId, tokenHash, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();

  if (isDevBypassEnabled()) {
    cookieStore.delete(DEV_BYPASS_SESSION_COOKIE);
    return;
  }

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await revokeSessionByTokenHash(hashToken(token));
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  if (isDevBypassEnabled()) {
    const hasBypassSession = cookieStore.get(DEV_BYPASS_SESSION_COOKIE)?.value === "1";
    return hasBypassSession ? getDevBypassUser() : null;
  }

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await findActiveSessionByTokenHash(hashToken(token));
  if (!session) return null;

  const user = await findUserById(session.userId);
  if (!user || user.status !== "ACTIVE") return null;

  return user;
}
