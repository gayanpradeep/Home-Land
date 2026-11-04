import { NextResponse } from "next/server";
import { getAuthenticatedDevice } from "@/lib/device-auth";
import { findBranchById } from "@/repositories/branch.repository";
import { findDepartmentById } from "@/repositories/department.repository";

export async function GET() {
  const device = await getAuthenticatedDevice();
  if (!device) {
    return NextResponse.json({ error: "Device is not activated." }, { status: 401 });
  }

  const [branch, department] = await Promise.all([
    findBranchById(device.branchId),
    findDepartmentById(device.departmentId),
  ]);

  return NextResponse.json({
    deviceCode: device.deviceCode,
    deviceName: device.deviceName,
    counterName: device.counterName,
    branchName: branch?.branchName ?? null,
    departmentName: department?.departmentName ?? null,
  });
}
