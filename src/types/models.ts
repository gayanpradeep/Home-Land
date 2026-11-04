export type AccountStatus = "ACTIVE" | "INACTIVE";

export type RatingScore = 1 | 2 | 3 | 4 | 5;

export const RATING_LABELS: Record<RatingScore, string> = {
  1: "Very Dissatisfied",
  2: "Dissatisfied",
  3: "Neutral",
  4: "Satisfied",
  5: "Very Satisfied",
};

export const RATING_EMOJIS: Record<RatingScore, string> = {
  1: "\u{1F621}",
  2: "\u{1F641}",
  3: "\u{1F610}",
  4: "\u{1F642}",
  5: "\u{1F60D}",
};

export interface Branch {
  id?: string;
  branchCode: string;
  branchName: string;
  address: string;
  contactPhone?: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id?: string;
  branchId: string;
  departmentCode: string;
  departmentName: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Every account is an admin — branch-level staff never log in; ratings are
// attributed purely by the authenticated kiosk device (see Device below).
export interface User {
  id?: string;
  fullName: string;
  username: string;
  passwordHash: string;
  status: AccountStatus;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  id?: string;
  deviceCode: string;
  deviceName: string;
  branchId: string;
  departmentId: string;
  counterName: string;
  deviceTokenHash: string;
  status: AccountStatus;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  id?: string;
  branchId: string;
  departmentId: string;
  deviceId: string;
  counterName: string;
  ratingScore: RatingScore;
  emoji: string;
  ratingLabel: string;
  submissionReference: string;
  submittedAt: Date;
  createdAt: Date;
}

export interface Feedback {
  id?: string;
  ratingId: string;
  branchId: string;
  departmentId: string;
  reasonCodes: string[];
  comment?: string;
  createdAt: Date;
}

export interface Session {
  id?: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export interface DailySummary {
  id?: string;
  branchId: string;
  departmentId: string;
  dateKey: string;
  totalRatings: number;
  totalScore: number;
  countByScore: Record<RatingScore, number>;
  updatedAt: Date;
}

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_BRANCH"
  | "UPDATE_BRANCH"
  | "CREATE_DEPARTMENT"
  | "UPDATE_DEPARTMENT"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "CREATE_DEVICE"
  | "UPDATE_DEVICE"
  | "SUBMIT_RATING";

export interface AuditLog {
  id?: string;
  action: AuditAction;
  actorUserId?: string;
  actorDeviceId?: string;
  targetCollection?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
