import { db } from "@/lib/db";
import type { FeedbackReason } from "@/types/models";

export async function listFeedbackReasons(): Promise<FeedbackReason[]> {
  return db.feedbackReason.findMany({ orderBy: { createdAt: "asc" } });
}

export async function findFeedbackReasonByCode(code: string): Promise<FeedbackReason | null> {
  return db.feedbackReason.findUnique({ where: { code } });
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
  const existing = await findFeedbackReasonByCode(args.code);
  if (existing) {
    throw new DuplicateFeedbackReasonCodeError();
  }

  return db.feedbackReason.create({
    data: {
      code: args.code,
      label: args.label,
      status: args.status,
    },
  });
}

export interface UpdateFeedbackReasonArgs {
  code: string;
  label: string;
  status: "ACTIVE" | "INACTIVE";
}

export async function updateFeedbackReason(id: string, args: UpdateFeedbackReasonArgs): Promise<void> {
  const existing = await findFeedbackReasonByCode(args.code);
  if (existing && existing.id !== id) {
    throw new DuplicateFeedbackReasonCodeError();
  }

  await db.feedbackReason.update({
    where: { id },
    data: {
      code: args.code,
      label: args.label,
      status: args.status,
    },
  });
}

export async function deleteFeedbackReason(id: string): Promise<void> {
  await db.feedbackReason.delete({ where: { id } });
}
