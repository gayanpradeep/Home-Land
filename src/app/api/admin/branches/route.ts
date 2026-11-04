import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { createBranchSchema } from "@/lib/validations";
import {
  listBranches,
  createBranch,
  DuplicateBranchCodeError,
} from "@/repositories/branch.repository";
import { isDevBypassEnabled } from "@/lib/dev-bypass";

const PREVIEW_BRANCHES = [
  "Colombo Head Branch",
  "Kandy Branch",
  "Galle Branch",
  "Kurunegala Branch",
  "Jaffna Branch",
  "Negombo Branch",
].map((branchName, i) => ({
  id: `preview-branch-${i}`,
  branchCode: `BR${String(i + 1).padStart(2, "0")}`,
  branchName,
  address: "Preview mode — no database connected",
  status: "ACTIVE" as const,
}));

export async function GET() {
  try {
    await requireAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(PREVIEW_BRANCHES);
    }

    const branches = await listBranches();
    return NextResponse.json(
      branches.map((b) => ({
        id: b.id,
        branchCode: b.branchCode,
        branchName: b.branchName,
        address: b.address,
        status: b.status,
      })),
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to load branches." }, { status: 500 });
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
        { error: "Creating branches is disabled in preview mode (no database connected)." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const input = createBranchSchema.parse(body);

    const branch = await createBranch(input);

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof DuplicateBranchCodeError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid branch details.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create branch." }, { status: 500 });
  }
}
