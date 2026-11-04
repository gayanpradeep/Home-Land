import type { User } from "@/types/models";

export function toPublicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    userType: user.userType,
    branchId: user.branchId ?? null,
    departmentId: user.departmentId ?? null,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
  };
}
