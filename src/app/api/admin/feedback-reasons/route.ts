import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { createFeedbackReasonSchema } from "@/lib/validations";
import {
  listFeedbackReasons,
  createFeedbackReason,
  DuplicateFeedbackReasonCodeError,
} from "@/repositories/feedback-reason.repository";
import { isDevBypassEnabled, getDevBypassFeedbackReasons } from "@/lib/dev-bypass";

export async function GET() {
  try {
    await requireAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(getDevBypassFeedbackReasons());
    }

    const reasons = await listFeedbackReasons();
    return NextResponse.json(
      reasons.map((r) => ({ id: r.id, code: r.code, label: r.label, status: r.status })),
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to load feedback reasons." }, { status: 500 });
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
        { error: "Creating feedback reasons is disabled in preview mode (no database connected)." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const input = createFeedbackReasonSchema.parse(body);

    const reason = await createFeedbackReason(input);

    return NextResponse.json({ reason }, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof DuplicateFeedbackReasonCodeError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid feedback reason details.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create feedback reason." }, { status: 500 });
  }
}
