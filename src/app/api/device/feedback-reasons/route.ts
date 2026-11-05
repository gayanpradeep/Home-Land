import { NextResponse } from "next/server";
import { getAuthenticatedDevice } from "@/lib/device-auth";
import { listFeedbackReasons } from "@/repositories/feedback-reason.repository";
import { isDevBypassEnabled, getDevBypassFeedbackReasons } from "@/lib/dev-bypass";

export async function GET() {
  const device = await getAuthenticatedDevice();
  if (!device) {
    return NextResponse.json({ error: "Device is not activated." }, { status: 401 });
  }

  if (isDevBypassEnabled()) {
    return NextResponse.json(
      getDevBypassFeedbackReasons()
        .filter((r) => r.status === "ACTIVE")
        .map((r) => ({ code: r.code, label: r.label })),
    );
  }

  const reasons = await listFeedbackReasons();
  return NextResponse.json(
    reasons.filter((r) => r.status === "ACTIVE").map((r) => ({ code: r.code, label: r.label })),
  );
}
