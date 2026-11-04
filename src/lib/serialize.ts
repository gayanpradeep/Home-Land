import type { User } from "@/types/models";

export function toPublicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
  };
}
