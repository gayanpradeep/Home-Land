import { MongoServerError, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { Feedback, Rating, RatingScore } from "@/types/models";
import { RATING_EMOJIS, RATING_LABELS } from "@/types/models";

const DUPLICATE_KEY_ERROR_CODE = 11000;

interface InsertRatingArgs {
  branchId: ObjectId;
  departmentId: ObjectId;
  deviceId: ObjectId;
  counterName: string;
  ratingScore: RatingScore;
  submissionReference: string;
}

/**
 * Idempotent by submissionReference (unique index). A client retry after a network
 * failure safely resolves to the original rating instead of creating a duplicate.
 */
export async function insertRating(args: InsertRatingArgs): Promise<{ rating: Rating; isDuplicate: boolean }> {
  const db = await getDb();
  const now = new Date();
  const collection = db.collection<Rating>(COLLECTIONS.RATINGS);

  const doc: Rating = {
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
    const result = await collection.insertOne(doc);
    return { rating: { ...doc, _id: result.insertedId }, isDuplicate: false };
  } catch (error) {
    if (error instanceof MongoServerError && error.code === DUPLICATE_KEY_ERROR_CODE) {
      const existing = await collection.findOne({ submissionReference: args.submissionReference });
      if (existing) return { rating: existing, isDuplicate: true };
    }
    throw error;
  }
}

interface InsertFeedbackArgs {
  ratingId: ObjectId;
  branchId: ObjectId;
  departmentId: ObjectId;
  reasonCodes: string[];
  comment?: string;
}

export async function insertFeedback(args: InsertFeedbackArgs): Promise<void> {
  const db = await getDb();

  const doc: Feedback = {
    ratingId: args.ratingId,
    branchId: args.branchId,
    departmentId: args.departmentId,
    reasonCodes: args.reasonCodes,
    comment: args.comment,
    createdAt: new Date(),
  };

  await db.collection<Feedback>(COLLECTIONS.FEEDBACK).insertOne(doc);
}
