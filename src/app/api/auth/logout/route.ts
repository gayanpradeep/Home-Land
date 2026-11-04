import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/csrf";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  await destroyCurrentSession();
  return NextResponse.json({ ok: true });
}
