import { getDb, tsToDate } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { RatingScore } from "@/types/models";
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

// Firestore has no server-side group-by/aggregation pipeline, so the matching
// ratings are fetched once per request and reduced in application code. This is
// fine at this app's scale (a date-range query, not a full-table scan) but if
// ratings volume grows substantially this should move to pre-aggregated
// dailySummaries written at submission time instead of raw fan-out reads.
//
// Only the date-range filter is applied server-side; branchId/departmentId are
// filtered here in application code rather than added as Firestore `.where()`
// equality clauses. Combining a range filter on one field with an equality
// filter on another requires a Firestore composite index, and this app doesn't
// assume one has been deployed (see firestore.indexes.json) — filtering here
// works correctly with no index at all, at the cost of fetching a few more
// documents than strictly necessary.
async function fetchRatingRows(filter: DashboardFilter): Promise<RatingRow[]> {
  const db = getDb();
  const query = db
    .collection(COLLECTIONS.RATINGS)
    .where("submittedAt", ">=", filter.from)
    .where("submittedAt", "<", filter.to);

  const snapshot = await query.get();
  const rows = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ratingScore: data.ratingScore as RatingScore,
      submittedAt: tsToDate(data.submittedAt) ?? new Date(0),
      branchId: data.branchId as string,
      departmentId: data.departmentId as string,
    };
  });

  return rows.filter(
    (row) =>
      (!filter.branchId || row.branchId === filter.branchId) &&
      (!filter.departmentId || row.departmentId === filter.departmentId),
  );
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

export interface NegativeFeedbackItem {
  id: string;
  ratingScore: RatingScore;
  emoji: string;
  ratingLabel: string;
  branchName: string;
  departmentName: string;
  reasonCodes: string[];
  comment?: string;
  submittedAt: Date;
}

// Every Feedback document is written only from the reason step the kiosk
// shows after a Very Dissatisfied / Dissatisfied selection (see
// rating-screen.tsx's handleSelectEmoji + the /api/device/ratings route) —
// so there is no separate "is this negative?" filter to apply here, every
// row in this collection already is one.
export async function getNegativeFeedback(
  filter: DashboardFilter,
  limitCount = 50,
): Promise<NegativeFeedbackItem[]> {
  const db = getDb();

  const snapshot = await db
    .collection(COLLECTIONS.FEEDBACK)
    .where("createdAt", ">=", filter.from)
    .where("createdAt", "<", filter.to)
    .get();

  const rows = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ratingId: data.ratingId as string,
        branchId: data.branchId as string,
        departmentId: data.departmentId as string,
        reasonCodes: (data.reasonCodes as string[] | undefined) ?? [],
        comment: data.comment as string | undefined,
        createdAt: tsToDate(data.createdAt) ?? new Date(0),
      };
    })
    .filter(
      (row) =>
        (!filter.branchId || row.branchId === filter.branchId) &&
        (!filter.departmentId || row.departmentId === filter.departmentId),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limitCount);

  if (rows.length === 0) return [];

  const [ratingDocs, branchDocs, departmentDocs] = await Promise.all([
    Promise.all(rows.map((row) => db.collection(COLLECTIONS.RATINGS).doc(row.ratingId).get())),
    Promise.all(
      [...new Set(rows.map((row) => row.branchId))].map((id) => db.collection(COLLECTIONS.BRANCHES).doc(id).get()),
    ),
    Promise.all(
      [...new Set(rows.map((row) => row.departmentId))].map((id) =>
        db.collection(COLLECTIONS.DEPARTMENTS).doc(id).get(),
      ),
    ),
  ]);

  const ratingScoreById = new Map(ratingDocs.map((doc) => [doc.id, doc.data()?.ratingScore as RatingScore | undefined]));
  const branchNameById = new Map(
    branchDocs.map((doc) => [doc.id, (doc.data() as { branchName?: string } | undefined)?.branchName ?? "Unknown"]),
  );
  const departmentNameById = new Map(
    departmentDocs.map((doc) => [
      doc.id,
      (doc.data() as { departmentName?: string } | undefined)?.departmentName ?? "Unknown",
    ]),
  );

  return rows.map((row) => {
    const ratingScore = ratingScoreById.get(row.ratingId) ?? 1;
    return {
      id: row.id,
      ratingScore,
      emoji: RATING_EMOJIS[ratingScore],
      ratingLabel: RATING_LABELS[ratingScore],
      branchName: branchNameById.get(row.branchId) ?? "Unknown",
      departmentName: departmentNameById.get(row.departmentId) ?? "Unknown",
      reasonCodes: row.reasonCodes,
      comment: row.comment,
      submittedAt: row.createdAt,
    };
  });
}
