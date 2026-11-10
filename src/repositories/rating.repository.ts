import { getDb, tsToDate, stripUndefined } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { BadReviewStatus, Feedback, Rating, RatingScore } from "@/types/models";
import { RATING_EMOJIS, RATING_LABELS } from "@/types/models";

interface InsertRatingArgs {
  branchId: string;
  departmentId: string;
  deviceId: string;
  counterName: string;
  ratingScore: RatingScore;
  submissionReference: string;
}

function fromDoc(doc: FirebaseFirestore.DocumentSnapshot): Rating {
  const data = doc.data() as Omit<Rating, "id" | "submittedAt" | "createdAt"> & {
    submittedAt: unknown;
    createdAt: unknown;
  };
  return {
    ...data,
    id: doc.id,
    submittedAt: tsToDate(data.submittedAt) ?? new Date(0),
    createdAt: tsToDate(data.createdAt) ?? new Date(0),
  };
}

/**
 * Idempotent by submissionReference: it is used as the Firestore document ID itself,
 * so a client retry after a network failure safely resolves to the original rating
 * instead of creating a duplicate.
 */
export async function insertRating(args: InsertRatingArgs): Promise<{ rating: Rating; isDuplicate: boolean }> {
  const db = getDb();
  const now = new Date();
  const collection = db.collection(COLLECTIONS.RATINGS);
  const ref = collection.doc(args.submissionReference);

  const doc = {
    branchId: args.branchId,
    departmentId: args.departmentId,
    deviceId: args.deviceId,
    counterName: args.counterName,
    ratingScore: args.ratingScore,
    emoji: RATING_EMOJIS[args.ratingScore],
    ratingLabel: RATING_LABELS[args.ratingScore],
    submissionReference: args.submissionReference,
    submittedAt: now,
    createdAt: now,
  };

  try {
    await ref.create(doc);
    return { rating: { ...doc, id: ref.id }, isDuplicate: false };
  } catch (error) {
    const existing = await ref.get();
    if (existing.exists) {
      return { rating: fromDoc(existing), isDuplicate: true };
    }
    throw error;
  }
}

interface InsertFeedbackArgs {
  ratingId: string;
  branchId: string;
  departmentId: string;
  reasonCodes: string[];
  comment?: string;
  customerName?: string;
  customerContactNumber?: string;
}

export async function insertFeedback(args: InsertFeedbackArgs): Promise<void> {
  const db = getDb();

  const doc: Omit<Feedback, "id"> = {
    ratingId: args.ratingId,
    branchId: args.branchId,
    departmentId: args.departmentId,
    reasonCodes: args.reasonCodes,
    comment: args.comment,
    customerName: args.customerName,
    customerContactNumber: args.customerContactNumber,
    status: "PENDING",
    createdAt: new Date(),
  };

  await db.collection(COLLECTIONS.FEEDBACK).add(stripUndefined(doc));
}

export async function updateFeedbackStatus(id: string, status: BadReviewStatus): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.FEEDBACK).doc(id).update({ status });
}
