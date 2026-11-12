import { db } from "@/lib/db";
import type { BadReviewStatus, RatingScore } from "@/types/models";
import { RATING_EMOJIS, RATING_LABELS } from "@/types/models";

export interface DashboardFilter {
  from: Date;
  to: Date;
  branchId?: string;
  departmentId?: string;
}

interface RatingRow {
  ratingScore: RatingScore;
  submittedAt: Date;
  branchId: string;
  departmentId: string;
}

function rangeWhere(filter: DashboardFilter) {
  return {
    submittedAt: { gte: filter.from, lt: filter.to },
    ...(filter.branchId ? { branchId: filter.branchId } : {}),
    ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
  };
}

async function fetchRatingRows(filter: DashboardFilter): Promise<RatingRow[]> {
  const rows = await db.rating.findMany({
    where: rangeWhere(filter),
    select: { ratingScore: true, submittedAt: true, branchId: true, departmentId: true },
  });
  return rows.map((row) => ({ ...row, ratingScore: row.ratingScore as RatingScore }));
}

export interface DashboardSummary {
  totalRatings: number;
  averageRating: number;
  satisfactionRate: number;
  negativeRate: number;
  activeBranches: number;
  activeDevices: number;
  emojiDistribution: { score: number; count: number }[];
}

export async function getDashboardSummary(filter: DashboardFilter): Promise<DashboardSummary> {
  const [rows, activeBranches, activeDevices] = await Promise.all([
    fetchRatingRows(filter),
    db.branch.count({ where: { status: "ACTIVE" } }),
    db.device.count({ where: { status: "ACTIVE" } }),
  ]);

  const countByScore = new Map<number, number>();
  for (const row of rows) {
    countByScore.set(row.ratingScore, (countByScore.get(row.ratingScore) ?? 0) + 1);
  }

  let totalRatings = 0;
  let totalScore = 0;
  let satisfactionCount = 0;
  let negativeCount = 0;

  for (let score = 1; score <= 5; score += 1) {
    const count = countByScore.get(score) ?? 0;
    totalRatings += count;
    totalScore += count * score;
    if (score >= 4) satisfactionCount += count;
    if (score <= 2) negativeCount += count;
  }

  return {
    totalRatings,
    averageRating: totalRatings > 0 ? totalScore / totalRatings : 0,
    satisfactionRate: totalRatings > 0 ? (satisfactionCount / totalRatings) * 100 : 0,
    negativeRate: totalRatings > 0 ? (negativeCount / totalRatings) * 100 : 0,
    activeBranches,
    activeDevices,
    emojiDistribution: [1, 2, 3, 4, 5].map((score) => ({
      score,
      count: countByScore.get(score) ?? 0,
    })),
  };
}

export interface TrendPoint {
  date: string;
  totalRatings: number;
  averageRating: number;
}

function toColomboDateKey(date: Date): string {
  const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const shifted = new Date(date.getTime() + COLOMBO_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getDashboardTrend(filter: DashboardFilter): Promise<TrendPoint[]> {
  const rows = await fetchRatingRows(filter);

  const byDate = new Map<string, { totalRatings: number; totalScore: number }>();
  for (const row of rows) {
    const key = toColomboDateKey(row.submittedAt);
    const bucket = byDate.get(key) ?? { totalRatings: 0, totalScore: 0 };
    bucket.totalRatings += 1;
    bucket.totalScore += row.ratingScore;
    byDate.set(key, bucket);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, { totalRatings, totalScore }]) => ({
      date,
      totalRatings,
      averageRating: totalRatings > 0 ? totalScore / totalRatings : 0,
    }));
}

export interface EntityPerformance {
  id: string;
  name: string;
  totalRatings: number;
  averageRating: number;
  satisfactionRate: number;
  negativeRate: number;
}

async function aggregateByEntity(
  filter: DashboardFilter,
  groupField: "branchId" | "departmentId",
): Promise<EntityPerformance[]> {
  const rows = await fetchRatingRows(filter);

  const byEntity = new Map<
    string,
    { totalRatings: number; totalScore: number; satisfactionCount: number; negativeCount: number }
  >();

  for (const row of rows) {
    const key = row[groupField];
    const bucket = byEntity.get(key) ?? {
      totalRatings: 0,
      totalScore: 0,
      satisfactionCount: 0,
      negativeCount: 0,
    };
    bucket.totalRatings += 1;
    bucket.totalScore += row.ratingScore;
    if (row.ratingScore >= 4) bucket.satisfactionCount += 1;
    if (row.ratingScore <= 2) bucket.negativeCount += 1;
    byEntity.set(key, bucket);
  }

  const entityIds = [...byEntity.keys()];
  const nameById = new Map<string, string>();
  if (entityIds.length > 0) {
    if (groupField === "branchId") {
      const branches = await db.branch.findMany({
        where: { id: { in: entityIds } },
        select: { id: true, branchName: true },
      });
      for (const branch of branches) nameById.set(branch.id, branch.branchName);
    } else {
      const departments = await db.department.findMany({
        where: { id: { in: entityIds } },
        select: { id: true, departmentName: true },
      });
      for (const department of departments) nameById.set(department.id, department.departmentName);
    }
  }

  return entityIds
    .map((id) => {
      const { totalRatings, totalScore, satisfactionCount, negativeCount } = byEntity.get(id)!;
      return {
        id,
        name: nameById.get(id) ?? "Unknown",
        totalRatings,
        averageRating: totalRatings > 0 ? totalScore / totalRatings : 0,
        satisfactionRate: totalRatings > 0 ? (satisfactionCount / totalRatings) * 100 : 0,
        negativeRate: totalRatings > 0 ? (negativeCount / totalRatings) * 100 : 0,
      };
    })
    .sort((a, b) => b.averageRating - a.averageRating);
}

export function getBranchPerformance(filter: DashboardFilter): Promise<EntityPerformance[]> {
  return aggregateByEntity(filter, "branchId");
}

export function getDepartmentPerformance(filter: DashboardFilter): Promise<EntityPerformance[]> {
  return aggregateByEntity(filter, "departmentId");
}

export interface NegativeFeedbackItem {
  id: string;
  ratingScore: RatingScore;
  emoji: string;
  ratingLabel: string;
  branchName: string;
  departmentName: string;
  reasonCodes: string[];
  comment?: string;
  customerName?: string;
  customerContactNumber?: string;
  status: BadReviewStatus;
  submittedAt: Date;
}

// Every Feedback row is written only from the reason step the kiosk shows
// after a Very Dissatisfied / Dissatisfied selection (see rating-screen.tsx's
// handleSelectEmoji + the /api/device/ratings route) — so there is no
// separate "is this negative?" filter to apply here, every row here already is one.
export async function getNegativeFeedback(
  filter: DashboardFilter,
  limitCount = 50,
): Promise<NegativeFeedbackItem[]> {
  const rows = await db.feedback.findMany({
    where: {
      createdAt: { gte: filter.from, lt: filter.to },
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
      ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limitCount,
    include: {
      rating: { select: { ratingScore: true } },
      branch: { select: { branchName: true } },
      department: { select: { departmentName: true } },
    },
  });

  return rows.map((row) => {
    const ratingScore = (row.rating?.ratingScore as RatingScore | undefined) ?? 1;
    return {
      id: row.id,
      ratingScore,
      emoji: RATING_EMOJIS[ratingScore],
      ratingLabel: RATING_LABELS[ratingScore],
      branchName: row.branch?.branchName ?? "Unknown",
      departmentName: row.department?.departmentName ?? "Unknown",
      reasonCodes: row.reasonCodes,
      comment: row.comment ?? undefined,
      customerName: row.customerName ?? undefined,
      customerContactNumber: row.customerContactNumber ?? undefined,
      status: row.status,
      submittedAt: row.createdAt,
    };
  });
}
