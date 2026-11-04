import { getDb, tsToDate } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { RatingScore } from "@/types/models";

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

// Firestore has no server-side group-by/aggregation pipeline, so the matching
// ratings are fetched once per request and reduced in application code. This is
// fine at this app's scale (a date-range query, not a full-table scan) but if
// ratings volume grows substantially this should move to pre-aggregated
// dailySummaries written at submission time instead of raw fan-out reads.
async function fetchRatingRows(filter: DashboardFilter): Promise<RatingRow[]> {
  const db = getDb();
  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.RATINGS)
    .where("submittedAt", ">=", filter.from)
    .where("submittedAt", "<", filter.to);

  if (filter.branchId) query = query.where("branchId", "==", filter.branchId);
  if (filter.departmentId) query = query.where("departmentId", "==", filter.departmentId);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ratingScore: data.ratingScore as RatingScore,
      submittedAt: tsToDate(data.submittedAt) ?? new Date(0),
      branchId: data.branchId as string,
      departmentId: data.departmentId as string,
    };
  });
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
  const db = getDb();

  const [rows, activeBranchesSnap, activeDevicesSnap] = await Promise.all([
    fetchRatingRows(filter),
    db.collection(COLLECTIONS.BRANCHES).where("status", "==", "ACTIVE").count().get(),
    db.collection(COLLECTIONS.DEVICES).where("status", "==", "ACTIVE").count().get(),
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
    activeBranches: activeBranchesSnap.data().count,
    activeDevices: activeDevicesSnap.data().count,
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
  lookupCollection: string,
): Promise<EntityPerformance[]> {
  const db = getDb();
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
  const entityDocs = await Promise.all(entityIds.map((id) => db.collection(lookupCollection).doc(id).get()));
  const nameById = new Map(
    entityDocs.map((doc) => {
      const data = doc.data() as { branchName?: string; departmentName?: string } | undefined;
      return [doc.id, data?.branchName ?? data?.departmentName ?? "Unknown"];
    }),
  );

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
  return aggregateByEntity(filter, "branchId", COLLECTIONS.BRANCHES);
}

export function getDepartmentPerformance(filter: DashboardFilter): Promise<EntityPerformance[]> {
  return aggregateByEntity(filter, "departmentId", COLLECTIONS.DEPARTMENTS);
}
