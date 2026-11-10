import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { updateFeedbackStatusSchema } from "@/lib/validations";
import { updateFeedbackStatus } from "@/repositories/rating.repository";
import { isDevBypassEnabled } from "@/lib/dev-bypass";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = updateFeedbackStatusSchema.parse(body);

    if (isDevBypassEnabled()) {
      return NextResponse.json({ ok: true });
    }

    await updateFeedbackStatus(id, status);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update feedback status." }, { status: 500 });
  }
}
