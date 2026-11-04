import { ObjectId } from "mongodb";
import { dashboardFilterQuerySchema } from "@/lib/validations";
import { resolveDateRange } from "@/lib/date-range";
import type { DashboardFilter } from "@/services/dashboard.service";

export function parseDashboardFilter(request: Request): DashboardFilter {
  const { searchParams } = new URL(request.url);

  const { preset, branchId, departmentId } = dashboardFilterQuerySchema.parse({
    preset: searchParams.get("preset") ?? undefined,
    branchId: searchParams.get("branchId") ?? undefined,
    departmentId: searchParams.get("departmentId") ?? undefined,
  });

  const { from, to } = resolveDateRange(preset);

  return {
    from,
    to,
    branchId: branchId ? new ObjectId(branchId) : undefined,
    departmentId: departmentId ? new ObjectId(departmentId) : undefined,
  };
}
