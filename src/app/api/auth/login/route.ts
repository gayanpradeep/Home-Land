import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { loginSchema } from "@/lib/validations";
import { findUserByUsername, touchLastLogin } from "@/repositories/user.repository";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";
import { toPublicUser } from "@/lib/serialize";
import { isDevBypassEnabled, getDevBypassUser, DEV_BYPASS_SESSION_COOKIE } from "@/lib/dev-bypass";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  let username: string;
  let password: string;

  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);
    username = parsed.username;
    password = parsed.password;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid username or password format." }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (isDevBypassEnabled()) {
    // No database is connected in preview mode — any credentials are accepted
    // and we simply flip the cookie that lets getCurrentUser() return the mock user.
    const cookieStore = await cookies();
    cookieStore.set(DEV_BYPASS_SESSION_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return NextResponse.json({ user: toPublicUser(getDevBypassUser()) });
  }

  const rateLimitKey = `${clientIp(request)}:${username}`;
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }

  const user = await findUserByUsername(username);

  if (!user || user.status !== "ACTIVE") {
    recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const passwordValid = await verifyPassword(user.passwordHash, password);
  if (!passwordValid) {
    recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  clearAttempts(rateLimitKey);

  if (!user._id) {
    return NextResponse.json({ error: "Account is misconfigured." }, { status: 500 });
  }

  await createSession(user._id);
  await touchLastLogin(user._id);

  return NextResponse.json({ user: toPublicUser(user) });
}
