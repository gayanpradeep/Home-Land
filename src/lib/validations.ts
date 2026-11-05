import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9._-]+$/, "Username may only contain letters, numbers, dots, dashes and underscores.");

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

export const ratingSubmissionSchema = z.object({
  ratingScore: z.number().int().min(1).max(5),
  submissionReference: z.string().uuid(),
  reasonCodes: z.array(z.string().max(50)).max(10).optional(),
  comment: z.string().trim().max(1000).optional(),
});

export const createDeviceSchema = z.object({
  deviceCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9._-]+$/, "Device code may only contain letters, numbers, dots, dashes and underscores."),
  counterName: z.string().trim().min(1).max(100),
  branchId: z.string().min(1),
  departmentId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const activateDeviceSchema = z.object({
  deviceCode: z.string().trim().min(1).max(100),
  activationSecret: z.string().min(1).max(200),
});

export const createBranchSchema = z.object({
  branchCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9._-]+$/, "Branch code may only contain letters, numbers, dots, dashes and underscores."),
  branchName: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(300),
  contactPhone: z.string().trim().max(50).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const createDepartmentSchema = z.object({
  branchId: z.string().min(1),
  departmentCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9._-]+$/, "Department code may only contain letters, numbers, dots, dashes and underscores."),
  departmentName: z.string().trim().min(1).max(200),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const createFeedbackReasonSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9._-]+$/, "Code may only contain letters, numbers, dots, dashes and underscores."),
  label: z.string().trim().min(1).max(200),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  username: usernameSchema,
  password: z.string().min(8).max(200),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const dateRangePresetSchema = z.enum([
  "today",
  "yesterday",
  "last7days",
  "last30days",
  "thisMonth",
  "previousMonth",
]);

export const dashboardFilterQuerySchema = z.object({
  preset: dateRangePresetSchema.default("last7days"),
  branchId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RatingSubmissionInput = z.infer<typeof ratingSubmissionSchema>;
export type DashboardFilterQuery = z.infer<typeof dashboardFilterQuerySchema>;
export type ActivateDeviceInput = z.infer<typeof activateDeviceSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreateFeedbackReasonInput = z.infer<typeof createFeedbackReasonSchema>;
