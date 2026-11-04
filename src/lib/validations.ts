import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

export const ratingSubmissionSchema = z.object({
  ratingScore: z.number().int().min(1).max(5),
  reasonCodes: z.array(z.string().max(50)).max(10).optional(),
  comment: z.string().trim().max(1000).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RatingSubmissionInput = z.infer<typeof ratingSubmissionSchema>;
