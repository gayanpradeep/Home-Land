import { NextResponse } from "next/server";
import { requireHeadOfficeAdmin, handleAuthError } from "@/lib/permissions";
import { parseDashboardFilter } from "@/lib/dashboard-filter";
import { getDashboardSummary } from "@/services/dashboard.service";
import { isDevBypassEnabled, getDevBypassDashboardSummary } from "@/lib/dev-bypass";

export async function GET(request: Request) {
  try {
    await requireHeadOfficeAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(getDevBypassDashboardSummary());
    }

    const filter = parseDashboardFilter(request);
    const summary = await getDashboardSummary(filter);
    return NextResponse.json(summary);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Dashboard summary failed:", error);
    return NextResponse.json({ error: "Unable to load dashboard summary." }, { status: 500 });
  }
}
