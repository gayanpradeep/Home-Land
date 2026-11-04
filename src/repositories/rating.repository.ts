import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { Feedback, Rating, RatingScore } from "@/types/models";
import { RATING_EMOJIS, RATING_LABELS } from "@/types/models";

interface InsertRatingArgs {
  branchId: ObjectId;
  departmentId: ObjectId;
  deviceId: ObjectId;
  counterName: string;
  ratingScore: RatingScore;
}

export async function insertRating(args: InsertRatingArgs): Promise<Rating> {
  const db = await getDb();
  const now = new Date();

  const doc: Rating = {
    branchId: args.branchId,
    departmentId: args.departmentId,
    deviceId: args.deviceId,
    counterName: args.counterName,
    ratingScore: args.ratingScore,
    emoji: RATING_EMOJIS[args.ratingScore],
    ratingLabel: RATING_LABELS[args.ratingScore],
    submissionReference: crypto.randomUUID(),
    submittedAt: now,
    createdAt: now,
  };

  const result = await db.collection<Rating>(COLLECTIONS.RATINGS).insertOne(doc);
  return { ...doc, _id: result.insertedId };
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
