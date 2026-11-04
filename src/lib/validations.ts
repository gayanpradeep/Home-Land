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

export const activateDeviceSchema = z.object({
  deviceCode: z.string().trim().min(1).max(100),
  activationSecret: z.string().min(1).max(200),
});

export const createUserSchema = z
  .object({
    fullName: z.string().trim().min(1).max(200),
    username: usernameSchema,
    password: z.string().min(8).max(200),
    userType: z.enum(["ADMIN", "BRANCH"]),
    branchId: z.string().length(24).optional(),
    departmentId: z.string().length(24).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  })
  .superRefine((data, ctx) => {
    if (data.userType === "BRANCH") {
      if (!data.branchId) {
        ctx.addIssue({ code: "custom", path: ["branchId"], message: "Branch is required." });
      }
      if (!data.departmentId) {
        ctx.addIssue({ code: "custom", path: ["departmentId"], message: "Department is required." });
      }
    }
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
  branchId: z.string().length(24).optional(),
  departmentId: z.string().length(24).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RatingSubmissionInput = z.infer<typeof ratingSubmissionSchema>;
export type DashboardFilterQuery = z.infer<typeof dashboardFilterQuerySchema>;
export type ActivateDeviceInput = z.infer<typeof activateDeviceSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
