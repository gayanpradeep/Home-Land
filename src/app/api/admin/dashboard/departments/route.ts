import { NextResponse } from "next/server";
import { requireHeadOfficeAdmin, handleAuthError } from "@/lib/permissions";
import { parseDashboardFilter } from "@/lib/dashboard-filter";
import { getDepartmentPerformance } from "@/services/dashboard.service";
import { isDevBypassEnabled, getDevBypassDepartmentPerformance } from "@/lib/dev-bypass";

export async function GET(request: Request) {
  try {
    await requireHeadOfficeAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(getDevBypassDepartmentPerformance());
    }

    const filter = parseDashboardFilter(request);
    const performance = await getDepartmentPerformance(filter);
    return NextResponse.json(performance);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Department performance failed:", error);
    return NextResponse.json({ error: "Unable to load department performance." }, { status: 500 });
  }
}
