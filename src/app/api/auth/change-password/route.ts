import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { changePasswordSchema } from "@/lib/validations";
import { requireUser, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { hashPassword, verifyPassword } from "@/lib/password";
import { updatePasswordHash } from "@/repositories/user.repository";
import { revokeAllSessionsForUser } from "@/repositories/session.repository";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const user = await requireUser();

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const currentValid = await verifyPassword(user.passwordHash, currentPassword);
    if (!currentValid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    if (!user.id) {
      return NextResponse.json({ error: "Account is misconfigured." }, { status: 500 });
    }

    const newHash = await hashPassword(newPassword);
    await updatePasswordHash(user.id, newHash, false);

    // Invalidate every existing session, then issue a fresh one for this request.
    await revokeAllSessionsForUser(user.id);
    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    if (error instanceof ZodError) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to change password." }, { status: 500 });
  }
}
