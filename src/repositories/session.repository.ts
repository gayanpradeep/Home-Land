import { getDb, tsToDate } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { Session } from "@/types/models";

function fromDoc(doc: FirebaseFirestore.DocumentSnapshot): Session {
  const data = doc.data() as Omit<Session, "id" | "expiresAt" | "createdAt" | "revokedAt"> & {
    expiresAt: unknown;
    createdAt: unknown;
    revokedAt?: unknown;
  };
  return {
    ...data,
    id: doc.id,
    expiresAt: tsToDate(data.expiresAt) ?? new Date(0),
    createdAt: tsToDate(data.createdAt) ?? new Date(0),
    revokedAt: tsToDate(data.revokedAt) ?? undefined,
  };
}

export async function createSessionRecord(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.SESSIONS).add({
    userId,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  });
}

export async function findActiveSessionByTokenHash(tokenHash: string): Promise<Session | null> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.SESSIONS)
    .where("tokenHash", "==", tokenHash)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const session = fromDoc(snapshot.docs[0]);
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;

  return session;
}

export async function revokeSessionByTokenHash(tokenHash: string): Promise<void> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.SESSIONS)
    .where("tokenHash", "==", tokenHash)
    .limit(1)
    .get();
  if (snapshot.empty) return;
  await snapshot.docs[0].ref.update({ revokedAt: new Date() });
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.SESSIONS).where("userId", "==", userId).get();
  const now = new Date();
  await Promise.all(
    snapshot.docs
      .filter((doc) => !doc.data().revokedAt)
      .map((doc) => doc.ref.update({ revokedAt: now })),
  );
}
