import { db } from "@/lib/db";
import type { Branch } from "@/types/models";

export async function findBranchById(id: string): Promise<Branch | null> {
  return db.branch.findUnique({ where: { id } });
}

export async function listBranches(): Promise<Branch[]> {
  return db.branch.findMany({ orderBy: { branchCode: "asc" } });
}

export async function findBranchByCode(branchCode: string): Promise<Branch | null> {
  return db.branch.findUnique({ where: { branchCode } });
}

export class DuplicateBranchCodeError extends Error {
  constructor() {
    super("Branch code is already in use.");
  }
}

export interface CreateBranchArgs {
  branchCode: string;
  branchName: string;
  address: string;
  contactPhone?: string;
  status: "ACTIVE" | "INACTIVE";
}

export async function createBranch(args: CreateBranchArgs): Promise<Branch> {
  const existing = await findBranchByCode(args.branchCode);
  if (existing) {
    throw new DuplicateBranchCodeError();
  }

  return db.branch.create({
    data: {
      branchCode: args.branchCode,
      branchName: args.branchName,
      address: args.address,
      contactPhone: args.contactPhone ?? "",
      status: args.status,
    },
  });
}

export interface UpdateBranchArgs {
  branchCode: string;
  branchName: string;
  address: string;
  contactPhone?: string;
  status: "ACTIVE" | "INACTIVE";
}

export async function updateBranch(id: string, args: UpdateBranchArgs): Promise<void> {
  const existing = await findBranchByCode(args.branchCode);
  if (existing && existing.id !== id) {
    throw new DuplicateBranchCodeError();
  }

  await db.branch.update({
    where: { id },
    data: {
      branchCode: args.branchCode,
      branchName: args.branchName,
      address: args.address,
      contactPhone: args.contactPhone ?? "",
      status: args.status,
    },
  });
}

export class BranchInUseError extends Error {
  constructor() {
    super("This branch still has departments or devices assigned to it.");
  }
}

export async function deleteBranch(id: string): Promise<void> {
  const [departmentCount, deviceCount] = await Promise.all([
    db.department.count({ where: { branchId: id } }),
    db.device.count({ where: { branchId: id } }),
  ]);

  if (departmentCount > 0 || deviceCount > 0) {
    throw new BranchInUseError();
  }

  await db.branch.delete({ where: { id } });
}
