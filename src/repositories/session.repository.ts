import { db } from "@/lib/db";
import type { Session } from "@/types/models";

function toSession(row: { id: string; userId: string; tokenHash: string; expiresAt: Date; createdAt: Date; revokedAt: Date | null }): Session {
  return { ...row, revokedAt: row.revokedAt ?? undefined };
}

export async function createSessionRecord(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await db.session.create({
    data: { userId, tokenHash, expiresAt },
  });
}

export async function findActiveSessionByTokenHash(tokenHash: string): Promise<Session | null> {
  const row = await db.session.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  return row ? toSession(row) : null;
}

export async function revokeSessionByTokenHash(tokenHash: string): Promise<void> {
  await db.session.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
