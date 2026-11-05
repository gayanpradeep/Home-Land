import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { parseDashboardFilter } from "@/lib/dashboard-filter";
import { getNegativeFeedback } from "@/services/dashboard.service";
import { isDevBypassEnabled, getDevBypassNegativeFeedback } from "@/lib/dev-bypass";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(getDevBypassNegativeFeedback());
    }

    const filter = parseDashboardFilter(request);
    const feedback = await getNegativeFeedback(filter);
    return NextResponse.json(feedback);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Dashboard feedback failed:", error);
    return NextResponse.json({ error: "Unable to load feedback." }, { status: 500 });
  }
}
