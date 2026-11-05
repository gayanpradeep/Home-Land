import { getDb, tsToDate } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { FeedbackReason } from "@/types/models";

function fromDoc(doc: FirebaseFirestore.DocumentSnapshot): FeedbackReason {
  const data = doc.data() as Omit<FeedbackReason, "id" | "createdAt" | "updatedAt"> & {
    createdAt: unknown;
    updatedAt: unknown;
  };
  return {
    ...data,
    id: doc.id,
    createdAt: tsToDate(data.createdAt) ?? new Date(0),
    updatedAt: tsToDate(data.updatedAt) ?? new Date(0),
  };
}

export async function listFeedbackReasons(): Promise<FeedbackReason[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.FEEDBACK_REASONS).orderBy("createdAt", "asc").get();
  return snapshot.docs.map(fromDoc);
}

export async function findFeedbackReasonByCode(code: string): Promise<FeedbackReason | null> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.FEEDBACK_REASONS)
    .where("code", "==", code)
    .limit(1)
    .get();
  return snapshot.empty ? null : fromDoc(snapshot.docs[0]);
}

export class DuplicateFeedbackReasonCodeError extends Error {
  constructor() {
    super("A feedback reason with this code already exists.");
  }
}

export interface CreateFeedbackReasonArgs {
  code: string;
  label: string;
  status: "ACTIVE" | "INACTIVE";
}

export async function createFeedbackReason(args: CreateFeedbackReasonArgs): Promise<FeedbackReason> {
  const db = getDb();
  const existing = await findFeedbackReasonByCode(args.code);
  if (existing) {
    throw new DuplicateFeedbackReasonCodeError();
  }

  const now = new Date();
  const doc = {
    code: args.code,
    label: args.label,
    status: args.status,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTIONS.FEEDBACK_REASONS).add(doc);
  return { ...doc, id: ref.id };
}

export interface UpdateFeedbackReasonArgs {
  code: string;
  label: string;
  status: "ACTIVE" | "INACTIVE";
}

export async function updateFeedbackReason(id: string, args: UpdateFeedbackReasonArgs): Promise<void> {
  const db = getDb();
  const existing = await findFeedbackReasonByCode(args.code);
  if (existing && existing.id !== id) {
    throw new DuplicateFeedbackReasonCodeError();
  }

  await db
    .collection(COLLECTIONS.FEEDBACK_REASONS)
    .doc(id)
    .update({
      code: args.code,
      label: args.label,
      status: args.status,
      updatedAt: new Date(),
    });
}

export async function deleteFeedbackReason(id: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.FEEDBACK_REASONS).doc(id).delete();
}
