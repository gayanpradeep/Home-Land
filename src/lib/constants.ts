export const COLLECTIONS = {
  BRANCHES: "branches",
  DEPARTMENTS: "departments",
  USERS: "users",
  DEVICES: "devices",
  RATINGS: "ratings",
  FEEDBACK: "feedback",
  FEEDBACK_REASONS: "feedbackReasons",
  SESSIONS: "sessions",
  DAILY_SUMMARIES: "dailySummaries",
  AUDIT_LOGS: "auditLogs",
} as const;

export const REPORTING_TIMEZONE = "Asia/Colombo";

export const DEFAULT_DEPARTMENTS = [
  "Sales",
  "Finance",
  "Customer Service",
  "Marketing",
  "Administration",
] as const;

export const BAD_REVIEW_STATUSES = ["PENDING", "IN_PROGRESS", "CLOSED"] as const;

export const BAD_REVIEW_STATUS_LABELS: Record<(typeof BAD_REVIEW_STATUSES)[number], string> = {
  PENDING: "Pending",
  IN_PROGRESS: "Take Action",
  CLOSED: "Close",
};

export const NEGATIVE_FEEDBACK_REASONS = [
  { code: "SLOW_SERVICE", label: "Service was too slow" },
  { code: "STAFF_ATTITUDE", label: "Staff attitude" },
  { code: "LONG_WAIT", label: "Long waiting time" },
  { code: "UNRESOLVED_ISSUE", label: "My issue was not resolved" },
  { code: "FACILITY", label: "Facility / environment" },
  { code: "OTHER", label: "Other" },
] as const;

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "hl_session";
export const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 12);

export const DEVICE_COOKIE_NAME = process.env.DEVICE_COOKIE_NAME ?? "hl_device";
