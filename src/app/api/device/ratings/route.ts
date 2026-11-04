import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ratingSubmissionSchema } from "@/lib/validations";
import { requireBranchDepartmentUser, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { findOrCreateDefaultDevice } from "@/repositories/device.repository";
import { insertRating, insertFeedback } from "@/repositories/rating.repository";
import type { RatingScore } from "@/types/models";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    // branchId/departmentId always come from the authenticated user, never the request body.
    const user = await requireBranchDepartmentUser();

    if (!user.branchId || !user.departmentId) {
      return NextResponse.json(
        { error: "This account has no assigned branch/department." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { ratingScore, reasonCodes, comment } = ratingSubmissionSchema.parse(body);

    const device = await findOrCreateDefaultDevice(user.branchId, user.departmentId);
    if (!device._id) {
      return NextResponse.json({ error: "Unable to resolve counter device." }, { status: 500 });
    }

    const rating = await insertRating({
      branchId: user.branchId,
      departmentId: user.departmentId,
      deviceId: device._id,
      counterName: device.counterName,
      ratingScore: ratingScore as RatingScore,
    });

    if (rating._id && ((reasonCodes && reasonCodes.length > 0) || comment)) {
      await insertFeedback({
        ratingId: rating._id,
        branchId: user.branchId,
        departmentId: user.departmentId,
        reasonCodes: reasonCodes ?? [],
        comment,
      });
    }

    return NextResponse.json({ ok: true, submissionReference: rating.submissionReference });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid rating submission." }, { status: 400 });
    }

    console.error("Rating submission failed:", error);
    return NextResponse.json({ error: "Unable to save rating." }, { status: 500 });
  }
}
