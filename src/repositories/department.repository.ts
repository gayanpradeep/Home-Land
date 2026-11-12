import { db } from "@/lib/db";
import type { Department } from "@/types/models";

export async function findDepartmentById(id: string): Promise<Department | null> {
  return db.department.findUnique({ where: { id } });
}

export async function listDepartments(): Promise<Department[]> {
  return db.department.findMany({ orderBy: { departmentName: "asc" } });
}

export async function listDepartmentsByBranch(branchId: string): Promise<Department[]> {
  return db.department.findMany({
    where: { branchId },
    orderBy: { departmentName: "asc" },
  });
}

export class DuplicateDepartmentCodeError extends Error {
  constructor() {
    super("That department code already exists for this branch.");
  }
}

export interface CreateDepartmentArgs {
  branchId: string;
  departmentCode: string;
  departmentName: string;
  status: "ACTIVE" | "INACTIVE";
}

export async function createDepartment(args: CreateDepartmentArgs): Promise<Department> {
  const existing = await db.department.findUnique({
    where: { branchId_departmentCode: { branchId: args.branchId, departmentCode: args.departmentCode } },
  });
  if (existing) {
    throw new DuplicateDepartmentCodeError();
  }

  return db.department.create({
    data: {
      branchId: args.branchId,
      departmentCode: args.departmentCode,
      departmentName: args.departmentName,
      status: args.status,
    },
  });
}

export interface UpdateDepartmentArgs {
  branchId: string;
  departmentCode: string;
  departmentName: string;
  status: "ACTIVE" | "INACTIVE";
}

export async function updateDepartment(id: string, args: UpdateDepartmentArgs): Promise<void> {
  const existing = await db.department.findUnique({
    where: { branchId_departmentCode: { branchId: args.branchId, departmentCode: args.departmentCode } },
  });
  if (existing && existing.id !== id) {
    throw new DuplicateDepartmentCodeError();
  }

  await db.department.update({
    where: { id },
    data: {
      branchId: args.branchId,
      departmentCode: args.departmentCode,
      departmentName: args.departmentName,
      status: args.status,
    },
  });
}

export class DepartmentInUseError extends Error {
  constructor() {
    super("This department still has devices assigned to it.");
  }
}

export async function deleteDepartment(id: string): Promise<void> {
  const deviceCount = await db.device.count({ where: { departmentId: id } });
  if (deviceCount > 0) {
    throw new DepartmentInUseError();
  }

  await db.department.delete({ where: { id } });
}
