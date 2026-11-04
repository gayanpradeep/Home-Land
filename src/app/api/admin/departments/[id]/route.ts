import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { createDepartmentSchema } from "@/lib/validations";
import {
  updateDepartment,
  deleteDepartment,
  DuplicateDepartmentCodeError,
  DepartmentInUseError,
} from "@/repositories/department.repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const input = createDepartmentSchema.parse(body);

    await updateDepartment(id, input);

    return NextResponse.json({ ok: true });
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
    return NextResponse.json({ error: "Unable to update department." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const { id } = await params;
    await deleteDepartment(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof DepartmentInUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to delete department." }, { status: 500 });
  }
}
