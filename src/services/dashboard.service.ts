import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS, REPORTING_TIMEZONE } from "@/lib/constants";

export interface DashboardFilter {
  from: Date;
  to: Date;
  branchId?: ObjectId;
  departmentId?: ObjectId;
}

function matchStage(filter: DashboardFilter) {
  const match: Record<string, unknown> = {
    submittedAt: { $gte: filter.from, $lt: filter.to },
  };
  if (filter.branchId) match.branchId = filter.branchId;
  if (filter.departmentId) match.departmentId = filter.departmentId;
  return { $match: match };
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
  const db = await getDb();

  const [ratingAgg, activeBranches, activeDevices] = await Promise.all([
    db
      .collection(COLLECTIONS.RATINGS)
      .aggregate([
        matchStage(filter),
        {
          $group: {
            _id: "$ratingScore",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    db.collection(COLLECTIONS.BRANCHES).countDocuments({ isActive: true }),
    db.collection(COLLECTIONS.DEVICES).countDocuments({ isActive: true }),
  ]);

  const countByScore = new Map<number, number>();
  for (const row of ratingAgg) {
    countByScore.set(row._id as number, row.count as number);
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

export async function getDashboardTrend(filter: DashboardFilter): Promise<TrendPoint[]> {
  const db = await getDb();

  const rows = await db
    .collection(COLLECTIONS.RATINGS)
    .aggregate([
      matchStage(filter),
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$submittedAt",
              timezone: REPORTING_TIMEZONE,
            },
          },
          totalRatings: { $sum: 1 },
          totalScore: { $sum: "$ratingScore" },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  return rows.map((row) => ({
    date: row._id as string,
    totalRatings: row.totalRatings as number,
    averageRating: row.totalRatings > 0 ? (row.totalScore as number) / (row.totalRatings as number) : 0,
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
  const db = await getDb();

  const rows = await db
    .collection(COLLECTIONS.RATINGS)
    .aggregate([
      matchStage(filter),
      {
        $group: {
          _id: `$${groupField}`,
          totalRatings: { $sum: 1 },
          totalScore: { $sum: "$ratingScore" },
          satisfactionCount: {
            $sum: { $cond: [{ $gte: ["$ratingScore", 4] }, 1, 0] },
          },
          negativeCount: {
            $sum: { $cond: [{ $lte: ["$ratingScore", 2] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: lookupCollection,
          localField: "_id",
          foreignField: "_id",
          as: "entity",
        },
      },
      { $unwind: "$entity" },
      {
        $addFields: {
          averageRating: { $divide: ["$totalScore", "$totalRatings"] },
        },
      },
      { $sort: { averageRating: -1 } },
    ])
    .toArray();

  return rows.map((row) => {
    const totalRatings = row.totalRatings as number;
    return {
      id: (row._id as ObjectId).toString(),
      name: (row.entity.branchName ?? row.entity.departmentName) as string,
      totalRatings,
      averageRating: totalRatings > 0 ? (row.totalScore as number) / totalRatings : 0,
      satisfactionRate: totalRatings > 0 ? ((row.satisfactionCount as number) / totalRatings) * 100 : 0,
      negativeRate: totalRatings > 0 ? ((row.negativeCount as number) / totalRatings) * 100 : 0,
    };
  });
}

export function getBranchPerformance(filter: DashboardFilter): Promise<EntityPerformance[]> {
  return aggregateByEntity(filter, "branchId", COLLECTIONS.BRANCHES);
}

export function getDepartmentPerformance(filter: DashboardFilter): Promise<EntityPerformance[]> {
  return aggregateByEntity(filter, "departmentId", COLLECTIONS.DEPARTMENTS);
}
