import type { ObjectId } from "mongodb";

export type UserType = "ADMIN" | "BRANCH";
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
  _id?: ObjectId;
  branchCode: string;
  branchName: string;
  address: string;
  contactPhone?: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  _id?: ObjectId;
  branchId: ObjectId;
  departmentCode: string;
  departmentName: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id?: ObjectId;
  fullName: string;
  username: string;
  passwordHash: string;
  userType: UserType;
  branchId: ObjectId | null;
  departmentId: ObjectId | null;
  status: AccountStatus;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  _id?: ObjectId;
  deviceCode: string;
  deviceName: string;
  branchId: ObjectId;
  departmentId: ObjectId;
  counterName: string;
  deviceTokenHash: string;
  status: AccountStatus;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  _id?: ObjectId;
  branchId: ObjectId;
  departmentId: ObjectId;
  deviceId: ObjectId;
  counterName: string;
  ratingScore: RatingScore;
  emoji: string;
  ratingLabel: string;
  submissionReference: string;
  submittedAt: Date;
  createdAt: Date;
}

export interface Feedback {
  _id?: ObjectId;
  ratingId: ObjectId;
  branchId: ObjectId;
  departmentId: ObjectId;
  reasonCodes: string[];
  comment?: string;
  createdAt: Date;
}

export interface Session {
  _id?: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export interface DailySummary {
  _id?: ObjectId;
  branchId: ObjectId;
  departmentId: ObjectId;
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
  _id?: ObjectId;
  action: AuditAction;
  actorUserId?: ObjectId;
  actorDeviceId?: ObjectId;
  targetCollection?: string;
  targetId?: ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
