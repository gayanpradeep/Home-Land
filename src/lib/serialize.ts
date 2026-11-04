import type { User } from "@/types/models";

export function toPublicUser(user: User) {
  return {
    id: user._id?.toString(),
    username: user.username,
    fullName: user.fullName,
    userType: user.userType,
    branchId: user.branchId?.toString() ?? null,
    departmentId: user.departmentId?.toString() ?? null,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
  };
}
