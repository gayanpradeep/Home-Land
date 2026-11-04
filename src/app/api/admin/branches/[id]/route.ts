import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { createBranchSchema } from "@/lib/validations";
import {
  updateBranch,
  deleteBranch,
  DuplicateBranchCodeError,
  BranchInUseError,
} from "@/repositories/branch.repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const input = createBranchSchema.parse(body);

    await updateBranch(id, input);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof DuplicateBranchCodeError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid branch details.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update branch." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const { id } = await params;
    await deleteBranch(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof BranchInUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to delete branch." }, { status: 500 });
  }
}
