import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { BadReviewStatus, Rating, RatingScore } from "@/types/models";
import { RATING_EMOJIS, RATING_LABELS } from "@/types/models";

function toRating(row: Omit<Rating, "ratingScore"> & { ratingScore: number }): Rating {
  return { ...row, ratingScore: row.ratingScore as RatingScore };
}

interface InsertRatingArgs {
  branchId: string;
  departmentId: string;
  deviceId: string;
  counterName: string;
  ratingScore: RatingScore;
  submissionReference: string;
}

/**
 * Idempotent by submissionReference: it is used as the row's primary key itself,
 * so a client retry after a network failure safely resolves to the original rating
 * instead of creating a duplicate.
 */
export async function insertRating(args: InsertRatingArgs): Promise<{ rating: Rating; isDuplicate: boolean }> {
  const now = new Date();

  try {
    const rating = await db.rating.create({
      data: {
        id: args.submissionReference,
        branchId: args.branchId,
        departmentId: args.departmentId,
        deviceId: args.deviceId,
        counterName: args.counterName,
        ratingScore: args.ratingScore,
        emoji: RATING_EMOJIS[args.ratingScore],
        ratingLabel: RATING_LABELS[args.ratingScore],
        submissionReference: args.submissionReference,
        submittedAt: now,
      },
    });
    return { rating: toRating(rating), isDuplicate: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await db.rating.findUnique({ where: { id: args.submissionReference } });
      if (existing) {
        return { rating: toRating(existing), isDuplicate: true };
      }
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
  await db.feedback.create({
    data: {
      ratingId: args.ratingId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      reasonCodes: args.reasonCodes,
      comment: args.comment,
      customerName: args.customerName,
      customerContactNumber: args.customerContactNumber,
      status: "PENDING",
    },
  });
}

export async function updateFeedbackStatus(id: string, status: BadReviewStatus): Promise<void> {
  await db.feedback.update({ where: { id }, data: { status } });
}
