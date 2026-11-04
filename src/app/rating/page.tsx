import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { findBranchById } from "@/repositories/branch.repository";
import { findDepartmentById } from "@/repositories/department.repository";
import { isDevBypassEnabled, getDevBypassBranch, getDevBypassDepartment } from "@/lib/dev-bypass";
import { getAuthenticatedDevice } from "@/lib/device-auth";
import { RatingScreen } from "@/components/customer-rating/rating-screen";
import { DeviceActivation } from "@/components/customer-rating/device-activation";

export default async function RatingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/rating");
  }

  if (user.userType !== "BRANCH") {
    redirect("/admin/dashboard");
  }

  if (!user.branchId || !user.departmentId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-lg text-destructive">
          This account has no assigned branch/department. Contact an administrator.
        </p>
      </div>
    );
  }

  // Ratings are attributed to the authenticated DEVICE, not the logged-in user —
  // this kiosk's browser must be activated once with an admin-issued device code/secret
  // before it can submit ratings at all.
  const device = await getAuthenticatedDevice();
  if (!device) {
    return <DeviceActivation />;
  }

  const [branch, department] = isDevBypassEnabled()
    ? [getDevBypassBranch(), getDevBypassDepartment()]
    : await Promise.all([findBranchById(user.branchId), findDepartmentById(user.departmentId)]);

  return (
    <RatingScreen
      branchName={branch?.branchName ?? ""}
      departmentName={department?.departmentName ?? ""}
      counterName="Service Counter 01"
    />
  );
}
