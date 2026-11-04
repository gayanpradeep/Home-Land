import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { ZodError } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { createUserSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/password";
import {
  listUsers,
  createUser,
  DuplicateUsernameError,
} from "@/repositories/user.repository";
import { listBranches } from "@/repositories/branch.repository";
import { listDepartments } from "@/repositories/department.repository";
import { isDevBypassEnabled } from "@/lib/dev-bypass";
import { toPublicUser } from "@/lib/serialize";

const PREVIEW_USERS = [
  {
    id: "preview-user-0",
    fullName: "System Administrator",
    username: "admin",
    userType: "ADMIN" as const,
    branchName: null,
    departmentName: null,
    status: "ACTIVE" as const,
    lastLoginAt: null,
  },
  {
    id: "preview-user-1",
    fullName: "Kamal Perera",
    username: "kamal.perera",
    userType: "BRANCH" as const,
    branchName: "Colombo Head Branch",
    departmentName: "Sales",
    status: "ACTIVE" as const,
    lastLoginAt: null,
  },
];

export async function GET() {
  try {
    await requireAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(PREVIEW_USERS);
    }

    const [users, branches, departments] = await Promise.all([
      listUsers(),
      listBranches(),
      listDepartments(),
    ]);

    const branchNameById = new Map(branches.map((b) => [b._id?.toString(), b.branchName]));
    const departmentNameById = new Map(departments.map((d) => [d._id?.toString(), d.departmentName]));

    return NextResponse.json(
      users.map((u) => ({
        id: u._id?.toString(),
        fullName: u.fullName,
        username: u.username,
        userType: u.userType,
        branchName: u.branchId ? (branchNameById.get(u.branchId.toString()) ?? null) : null,
        departmentName: u.departmentId ? (departmentNameById.get(u.departmentId.toString()) ?? null) : null,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
      })),
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to load users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    if (isDevBypassEnabled()) {
      return NextResponse.json(
        { error: "Creating users is disabled in preview mode (no database connected)." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const input = createUserSchema.parse(body);

    const passwordHash = await hashPassword(input.password);

    const user = await createUser({
      fullName: input.fullName,
      username: input.username,
      passwordHash,
      userType: input.userType,
      branchId: input.userType === "BRANCH" && input.branchId ? new ObjectId(input.branchId) : null,
      departmentId: input.userType === "BRANCH" && input.departmentId ? new ObjectId(input.departmentId) : null,
      status: input.status,
    });

    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof DuplicateUsernameError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid user details.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create user." }, { status: 500 });
  }
}
