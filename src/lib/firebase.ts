import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore as getAdminFirestore, Timestamp, type Firestore } from "firebase-admin/firestore";

declare global {
  var _firebaseApp: App | undefined;
}

function createApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY are not set. " +
        "Copy .env.local.example to .env.local and fill in your Firebase service account values.",
    );
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  const existing = getApps()[0];
  if (existing) return existing;

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

// Reuse a single app/Firestore instance across hot reloads and requests in the same
// process. The app is only constructed on first actual use, so pages that never touch
// the database can still render even if the Firebase env vars are unset.
function getApp(): App {
  return (globalThis._firebaseApp ??= createApp());
}

export function getDb(): Firestore {
  return getAdminFirestore(getApp());
}

// Firestore rejects `undefined` field values outright (no settings() toggle is safe
// to call here — Next.js can load this module into more than one runtime/worker in
// the same process, and settings() throws if called more than once anywhere on the
// same Firestore instance). Repositories strip undefined keys with this before writes
// instead of relying on ignoreUndefinedProperties.
export function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) delete result[key];
  }
  return result;
}

export function tsToDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}
