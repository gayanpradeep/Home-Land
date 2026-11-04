import { NextResponse } from "next/server";
import { requireHeadOfficeAdmin, handleAuthError } from "@/lib/permissions";
import { parseDashboardFilter } from "@/lib/dashboard-filter";
import { getDashboardTrend } from "@/services/dashboard.service";
import { isDevBypassEnabled, getDevBypassTrend } from "@/lib/dev-bypass";

export async function GET(request: Request) {
  try {
    await requireHeadOfficeAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(getDevBypassTrend());
    }

    const filter = parseDashboardFilter(request);
    const trend = await getDashboardTrend(filter);
    return NextResponse.json(trend);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Dashboard trend failed:", error);
    return NextResponse.json({ error: "Unable to load dashboard trend." }, { status: 500 });
  }
}
