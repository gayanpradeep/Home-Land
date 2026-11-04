import { findBranchById } from "@/repositories/branch.repository";
import { findDepartmentById } from "@/repositories/department.repository";
import { isDevBypassEnabled, getDevBypassBranch, getDevBypassDepartment } from "@/lib/dev-bypass";
import { getAuthenticatedDevice } from "@/lib/device-auth";
import { RatingScreen } from "@/components/customer-rating/rating-screen";
import { DeviceActivation } from "@/components/customer-rating/device-activation";

// No customer/staff login here by design: a kiosk is a shared public device, not
// something a person signs into per-visit. Ratings are attributed purely by the
// authenticated DEVICE credential (see getAuthenticatedDevice), which an admin
// bakes in once via the activation screen below. See /login for the separate
// admin dashboard login.
export default async function RatingPage() {
  const device = await getAuthenticatedDevice();
  if (!device) {
    return <DeviceActivation />;
  }

  const [branch, department] = isDevBypassEnabled()
    ? [getDevBypassBranch(), getDevBypassDepartment()]
    : await Promise.all([findBranchById(device.branchId), findDepartmentById(device.departmentId)]);

  return (
    <RatingScreen
      branchName={branch?.branchName ?? ""}
      departmentName={department?.departmentName ?? ""}
      counterName={device.counterName}
    />
  );
}
