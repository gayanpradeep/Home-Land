import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { createDepartmentSchema } from "@/lib/validations";
import {
  listDepartments,
  createDepartment,
  DuplicateDepartmentCodeError,
} from "@/repositories/department.repository";
import { isDevBypassEnabled } from "@/lib/dev-bypass";

const PREVIEW_DEPARTMENT_NAMES = ["Sales", "Finance", "Customer Service", "Marketing", "Administration"];

const PREVIEW_DEPARTMENTS = Array.from({ length: 6 }, (_, branchIndex) =>
  PREVIEW_DEPARTMENT_NAMES.map((departmentName, i) => ({
    id: `preview-department-${branchIndex}-${i}`,
    branchId: `preview-branch-${branchIndex}`,
    departmentCode: departmentName.toUpperCase().replace(/[^A-Z]+/g, "_"),
    departmentName,
    status: "ACTIVE" as const,
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
        departmentCode: d.departmentCode,
        departmentName: d.departmentName,
        status: d.status,
      })),
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to load departments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    if (isDevBypassEnabled()) {
      return NextResponse.json(
        { error: "Creating departments is disabled in preview mode (no database connected)." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const input = createDepartmentSchema.parse(body);

    const department = await createDepartment(input);

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof DuplicateDepartmentCodeError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid department details.", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Unable to create department." }, { status: 500 });
  }
}
