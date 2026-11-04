import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { listDepartments } from "@/repositories/department.repository";
import { isDevBypassEnabled } from "@/lib/dev-bypass";

const PREVIEW_DEPARTMENT_NAMES = ["Sales", "Finance", "Customer Service", "Marketing", "Administration"];

const PREVIEW_DEPARTMENTS = Array.from({ length: 6 }, (_, branchIndex) =>
  PREVIEW_DEPARTMENT_NAMES.map((departmentName, i) => ({
    id: `preview-department-${branchIndex}-${i}`,
    branchId: `preview-branch-${branchIndex}`,
    departmentName,
  })),
).flat();

export async function GET() {
  try {
    await requireAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(PREVIEW_DEPARTMENTS);
    }

    const departments = await listDepartments();
    return NextResponse.json(
      departments.map((d) => ({
        id: d.id,
        branchId: d.branchId,
        departmentName: d.departmentName,
      })),
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to load departments." }, { status: 500 });
  }
}
