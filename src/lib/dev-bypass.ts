import { ObjectId } from "mongodb";
import type { Branch, Department, User } from "@/types/models";

// Lets you preview /admin and /rate screens with no database connected.
// Hard-blocked in production regardless of the env flag, so it can never leak live.
export function isDevBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS_AUTH === "true";
}

const MOCK_ID = new ObjectId("000000000000000000000001");

export function getDevBypassUser(): User {
  const role = process.env.DEV_BYPASS_ROLE === "BRANCH_DEPARTMENT_USER"
    ? "BRANCH_DEPARTMENT_USER"
    : "HEAD_OFFICE_ADMIN";

  return {
    _id: MOCK_ID,
    email: "preview@local.dev",
    passwordHash: "",
    fullName: "Preview User",
    role,
    branchId: role === "BRANCH_DEPARTMENT_USER" ? MOCK_ID : undefined,
    departmentId: role === "BRANCH_DEPARTMENT_USER" ? MOCK_ID : undefined,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getDevBypassBranch(): Branch {
  return {
    _id: MOCK_ID,
    branchCode: "BR01",
    branchName: "Colombo Head Branch (Preview)",
    address: "Preview mode — no database connected",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getDevBypassDepartment(): Department {
  return {
    _id: MOCK_ID,
    branchId: MOCK_ID,
    departmentCode: "SALES",
    departmentName: "Sales (Preview)",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// --- Dashboard preview data (Phase 4) ---
// Deterministic-ish mock numbers so charts render meaningfully with no database.

const MOCK_BRANCH_NAMES = [
  "Colombo Head Branch",
  "Kandy Branch",
  "Galle Branch",
  "Kurunegala Branch",
  "Jaffna Branch",
  "Negombo Branch",
];

const MOCK_DEPARTMENT_NAMES = ["Sales", "Finance", "Customer Service", "Marketing", "Administration"];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function getDevBypassDashboardSummary() {
  const rand = seededRandom(42);
  const counts = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: Math.floor(40 + rand() * 160 * (score >= 3 ? 1.6 : 1)),
  }));
  const totalRatings = counts.reduce((sum, c) => sum + c.count, 0);
  const totalScore = counts.reduce((sum, c) => sum + c.count * c.score, 0);
  const satisfactionCount = counts.filter((c) => c.score >= 4).reduce((sum, c) => sum + c.count, 0);
  const negativeCount = counts.filter((c) => c.score <= 2).reduce((sum, c) => sum + c.count, 0);

  return {
    totalRatings,
    averageRating: totalScore / totalRatings,
    satisfactionRate: (satisfactionCount / totalRatings) * 100,
    negativeRate: (negativeCount / totalRatings) * 100,
    activeBranches: 20,
    activeDevices: 47,
    emojiDistribution: counts,
  };
}

export function getDevBypassTrend(days = 14) {
  const rand = seededRandom(7);
  const points = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const totalRatings = Math.floor(30 + rand() * 90);
    const averageRating = 3.2 + rand() * 1.5;
    points.push({
      date: date.toISOString().slice(0, 10),
      totalRatings,
      averageRating: Math.min(5, averageRating),
    });
  }
  return points;
}

export function getDevBypassBranchPerformance() {
  const rand = seededRandom(13);
  return MOCK_BRANCH_NAMES.map((name, i) => {
    const totalRatings = Math.floor(60 + rand() * 300);
    const averageRating = 3.0 + rand() * 2.0;
    return {
      id: `preview-branch-${i}`,
      name,
      totalRatings,
      averageRating: Math.min(5, averageRating),
      satisfactionRate: 50 + rand() * 45,
      negativeRate: rand() * 25,
    };
  }).sort((a, b) => b.averageRating - a.averageRating);
}

export function getDevBypassDepartmentPerformance() {
  const rand = seededRandom(99);
  return MOCK_DEPARTMENT_NAMES.map((name, i) => {
    const totalRatings = Math.floor(80 + rand() * 250);
    const averageRating = 3.0 + rand() * 2.0;
    return {
      id: `preview-department-${i}`,
      name,
      totalRatings,
      averageRating: Math.min(5, averageRating),
      satisfactionRate: 50 + rand() * 45,
      negativeRate: rand() * 25,
    };
  }).sort((a, b) => b.averageRating - a.averageRating);
}
