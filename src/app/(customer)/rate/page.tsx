import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { findBranchById } from "@/repositories/branch.repository";
import { findDepartmentById } from "@/repositories/department.repository";

export default async function RatePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/rate");
  }

  if (user.role !== "BRANCH_DEPARTMENT_USER") {
    redirect("/admin/dashboard");
  }

  if (!user.branchId || !user.departmentId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-lg text-destructive">
          This account has no assigned branch/department. Contact Head Office.
        </p>
      </div>
    );
  }

  const [branch, department] = await Promise.all([
    findBranchById(user.branchId),
    findDepartmentById(user.departmentId),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">{branch?.branchName}</h1>
      <p className="text-muted-foreground">{department?.departmentName}</p>
      <p className="mt-6 text-sm text-muted-foreground">
        The full emoji rating kiosk screen lands in Phase 3.
      </p>
    </div>
  );
}
