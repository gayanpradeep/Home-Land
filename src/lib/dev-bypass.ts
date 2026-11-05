import type { Branch, Department, Device, User } from "@/types/models";

// Lets you preview /admin and /rating screens with no database connected.
// Hard-blocked in production regardless of the env flag, so it can never leak live.
export function isDevBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS_AUTH === "true";
}

// Dev-bypass still requires visiting /login and submitting the form first —
// this cookie is what the login form flips on, so "/" shows the real login
// page instead of silently auto-logging you in on every visit.
export const DEV_BYPASS_SESSION_COOKIE = "hl_dev_bypass_session";

const MOCK_ID = "preview-mock-id";

export function getDevBypassUser(): User {
  return {
    id: MOCK_ID,
    username: "preview",
    passwordHash: "",
    fullName: "Preview Admin",
    status: "ACTIVE",
    mustChangePassword: false,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getDevBypassBranch(): Branch {
  return {
    id: MOCK_ID,
    branchCode: "BR01",
    branchName: "Colombo Head Branch (Preview)",
    address: "Preview mode — no database connected",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getDevBypassDepartment(): Department {
  return {
    id: MOCK_ID,
    branchId: MOCK_ID,
    departmentCode: "SALES",
    departmentName: "Sales (Preview)",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getDevBypassDevice(): Device {
  return {
    id: MOCK_ID,
    deviceCode: "DEV-PREVIEW-001",
    deviceName: "Preview Counter",
    branchId: MOCK_ID,
    departmentId: MOCK_ID,
    counterName: "Service Counter 01",
    deviceTokenHash: "",
    status: "ACTIVE",
    lastSeenAt: new Date(),
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

const MOCK_NEGATIVE_FEEDBACK = [
  {
    id: "preview-feedback-1",
    ratingScore: 1 as const,
    emoji: "\u{1F621}",
    ratingLabel: "Very Dissatisfied",
    branchName: "Colombo Head Branch",
    departmentName: "Customer Service",
    reasonCodes: ["LONG_WAIT", "STAFF_ATTITUDE"],
    comment: "Waited almost an hour and the staff member was dismissive when I asked for an update.",
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "preview-feedback-2",
    ratingScore: 2 as const,
    emoji: "\u{1F641}",
    ratingLabel: "Dissatisfied",
    branchName: "Kandy Branch",
    departmentName: "Finance",
    reasonCodes: ["UNRESOLVED_ISSUE"],
    comment: undefined,
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "preview-feedback-3",
    ratingScore: 1 as const,
    emoji: "\u{1F621}",
    ratingLabel: "Very Dissatisfied",
    branchName: "Galle Branch",
    departmentName: "Sales",
    reasonCodes: ["SLOW_SERVICE"],
    comment: "The queue management system was down for most of the visit.",
    submittedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
  },
];

export function getDevBypassNegativeFeedback() {
  return MOCK_NEGATIVE_FEEDBACK;
}

const MOCK_FEEDBACK_REASONS = [
  { id: "preview-reason-1", code: "SLOW_SERVICE", label: "Service was too slow", status: "ACTIVE" as const },
  { id: "preview-reason-2", code: "STAFF_ATTITUDE", label: "Staff attitude", status: "ACTIVE" as const },
  { id: "preview-reason-3", code: "LONG_WAIT", label: "Long waiting time", status: "ACTIVE" as const },
  { id: "preview-reason-4", code: "UNRESOLVED_ISSUE", label: "My issue was not resolved", status: "ACTIVE" as const },
  { id: "preview-reason-5", code: "FACILITY", label: "Facility / environment", status: "ACTIVE" as const },
  { id: "preview-reason-6", code: "OTHER", label: "Other", status: "ACTIVE" as const },
];

export function getDevBypassFeedbackReasons() {
  return MOCK_FEEDBACK_REASONS;
}
