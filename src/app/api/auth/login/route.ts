import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { loginSchema } from "@/lib/validations";
import { findUserByEmail, touchLastLogin } from "@/repositories/user.repository";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";
import { toPublicUser } from "@/lib/serialize";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  let email: string;
  let password: string;

  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);
    email = parsed.email;
    password = parsed.password;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid email or password format." }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rateLimitKey = `${clientIp(request)}:${email}`;
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }

  const user = await findUserByEmail(email);

  if (!user || !user.isActive) {
    recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const passwordValid = await verifyPassword(user.passwordHash, password);
  if (!passwordValid) {
    recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  clearAttempts(rateLimitKey);

  if (!user._id) {
    return NextResponse.json({ error: "Account is misconfigured." }, { status: 500 });
  }

  await createSession(user._id);
  await touchLastLogin(user._id);

  return NextResponse.json({ user: toPublicUser(user) });
}
