import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { listBranches } from "@/repositories/branch.repository";
import { isDevBypassEnabled } from "@/lib/dev-bypass";

const PREVIEW_BRANCHES = [
  "Colombo Head Branch",
  "Kandy Branch",
  "Galle Branch",
  "Kurunegala Branch",
  "Jaffna Branch",
  "Negombo Branch",
].map((branchName, i) => ({ id: `preview-branch-${i}`, branchName }));

export async function GET() {
  try {
    await requireAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(PREVIEW_BRANCHES);
    }

    const branches = await listBranches();
    return NextResponse.json(branches.map((b) => ({ id: b.id, branchName: b.branchName })));
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to load branches." }, { status: 500 });
  }
}
