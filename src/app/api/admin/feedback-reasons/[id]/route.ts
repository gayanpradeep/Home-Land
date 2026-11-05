import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { createFeedbackReasonSchema } from "@/lib/validations";
import {
  updateFeedbackReason,
  deleteFeedbackReason,
  DuplicateFeedbackReasonCodeError,
} from "@/repositories/feedback-reason.repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const input = createFeedbackReasonSchema.parse(body);

    await updateFeedbackReason(id, input);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof DuplicateFeedbackReasonCodeError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid feedback reason details.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update feedback reason." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const { id } = await params;
    await deleteFeedbackReason(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to delete feedback reason." }, { status: 500 });
  }
}
