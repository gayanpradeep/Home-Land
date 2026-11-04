import { ObjectId } from "mongodb";
import type { Branch, Department, User } from "@/types/models";

// Lets you preview /admin and /rate screens with no database connected.
// Hard-blocked in production regardless of the env flag, so it can never leak live.
export function isDevBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS_AUTH === "true";
}

const MOCK_ID = new ObjectId("000000000000000000000001");

export function getDevBypassUser(): User {
  const role = process.env.DEV_BYPASS_ROLE === "BRANCH_DEPARTMENT_USER"
    ? "BRANCH_DEPARTMENT_USER"
    : "HEAD_OFFICE_ADMIN";

  return {
    _id: MOCK_ID,
    email: "preview@local.dev",
    passwordHash: "",
    fullName: "Preview User",
    role,
    branchId: role === "BRANCH_DEPARTMENT_USER" ? MOCK_ID : undefined,
    departmentId: role === "BRANCH_DEPARTMENT_USER" ? MOCK_ID : undefined,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getDevBypassBranch(): Branch {
  return {
    _id: MOCK_ID,
    branchCode: "BR01",
    branchName: "Colombo Head Branch (Preview)",
    address: "Preview mode — no database connected",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getDevBypassDepartment(): Department {
  return {
    _id: MOCK_ID,
    branchId: MOCK_ID,
    departmentCode: "SALES",
    departmentName: "Sales (Preview)",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
