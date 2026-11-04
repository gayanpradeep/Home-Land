import { NextResponse } from "next/server";
import { requireHeadOfficeAdmin, handleAuthError } from "@/lib/permissions";
import { parseDashboardFilter } from "@/lib/dashboard-filter";
import { getBranchPerformance } from "@/services/dashboard.service";
import { isDevBypassEnabled, getDevBypassBranchPerformance } from "@/lib/dev-bypass";

export async function GET(request: Request) {
  try {
    await requireHeadOfficeAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(getDevBypassBranchPerformance());
    }

    const filter = parseDashboardFilter(request);
    const performance = await getBranchPerformance(filter);
    return NextResponse.json(performance);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Branch performance failed:", error);
    return NextResponse.json({ error: "Unable to load branch performance." }, { status: 500 });
  }
}
