import type { User } from "@/types/models";

export function toPublicUser(user: User) {
  return {
    id: user._id?.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    branchId: user.branchId?.toString(),
    departmentId: user.departmentId?.toString(),
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
}
