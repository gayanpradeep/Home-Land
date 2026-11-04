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

export async function requireHeadOfficeAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "HEAD_OFFICE_ADMIN") {
    throw new AuthError(403, "Head Office Admin access required.");
  }
  return user;
}

export async function requireBranchDepartmentUser(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "BRANCH_DEPARTMENT_USER") {
    throw new AuthError(403, "Branch user access required.");
  }
  return user;
}

/** Throws unless the Head Office Admin, or a branch user scoped to this exact branch+department, is asking. */
export function assertBranchDepartmentScope(
  user: User,
  branchId: ObjectId,
  departmentId: ObjectId,
): void {
  if (user.role === "HEAD_OFFICE_ADMIN") return;

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
