import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ratingSubmissionSchema } from "@/lib/validations";
import { isSameOriginRequest } from "@/lib/csrf";
import { getAuthenticatedDevice } from "@/lib/device-auth";
import { findBranchById } from "@/repositories/branch.repository";
import { findDepartmentById } from "@/repositories/department.repository";
import { insertRating, insertFeedback } from "@/repositories/rating.repository";
import type { RatingScore } from "@/types/models";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    // branchId/departmentId/deviceId/counterName always come from the authenticated
    // device credential, never from the request body.
    const device = await getAuthenticatedDevice();
    if (!device || !device._id) {
      return NextResponse.json({ error: "Device is not activated." }, { status: 401 });
    }

    const [branch, department] = await Promise.all([
      findBranchById(device.branchId),
      findDepartmentById(device.departmentId),
    ]);

    if (!branch || branch.status !== "ACTIVE") {
      return NextResponse.json({ error: "Branch is not active." }, { status: 403 });
    }
    if (!department || department.status !== "ACTIVE") {
      return NextResponse.json({ error: "Department is not active." }, { status: 403 });
    }

    const body = await request.json();
    const { ratingScore, submissionReference, reasonCodes, comment } = ratingSubmissionSchema.parse(body);

    const { rating, isDuplicate } = await insertRating({
      branchId: device.branchId,
      departmentId: device.departmentId,
      deviceId: device._id,
      counterName: device.counterName,
      ratingScore: ratingScore as RatingScore,
      submissionReference,
    });

    if (!isDuplicate && rating._id && ((reasonCodes && reasonCodes.length > 0) || comment)) {
      await insertFeedback({
        ratingId: rating._id,
        branchId: device.branchId,
        departmentId: device.departmentId,
        reasonCodes: reasonCodes ?? [],
        comment,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      data: { ratingScore: rating.ratingScore },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid rating submission." }, { status: 400 });
    }

    console.error("Rating submission failed:", error);
    return NextResponse.json({ error: "Unable to save rating." }, { status: 500 });
  }
}
