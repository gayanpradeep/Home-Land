import { NextResponse } from "next/server";
import type { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/session";
import type { User } from "@/types/models";

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Not authenticated.");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.userType !== "ADMIN") {
    throw new AuthError(403, "Admin access required.");
  }
  return user;
}

export async function requireBranchUser(): Promise<User> {
  const user = await requireUser();
  if (user.userType !== "BRANCH") {
    throw new AuthError(403, "Branch user access required.");
  }
  return user;
}

/** Throws unless the Admin, or a branch user scoped to this exact branch+department, is asking. */
export function assertBranchDepartmentScope(
  user: User,
  branchId: ObjectId,
  departmentId: ObjectId,
): void {
  if (user.userType === "ADMIN") return;

  const sameBranch = user.branchId?.equals(branchId);
  const sameDepartment = user.departmentId?.equals(departmentId);

  if (!sameBranch || !sameDepartment) {
    throw new AuthError(403, "Not authorized for this branch/department.");
  }
}

export function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
