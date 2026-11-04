import { NextResponse } from "next/server";
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

// Every logged-in user is an admin (see User in types/models.ts), so this is
// currently equivalent to requireUser() — kept as its own name for call-site
// clarity and in case non-admin accounts are reintroduced later.
export async function requireAdmin(): Promise<User> {
  return requireUser();
}

export function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
