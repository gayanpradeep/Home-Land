import { NextResponse } from "next/server";
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
import { isDevBypassEnabled } from "@/lib/dev-bypass";
import { toPublicUser } from "@/lib/serialize";

const PREVIEW_USERS = [
  {
    id: "preview-user-0",
    fullName: "System Administrator",
    username: "admin",
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

    const users = await listUsers();

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        username: u.username,
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
