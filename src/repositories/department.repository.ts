import { getDb, tsToDate } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { Department } from "@/types/models";

function fromDoc(doc: FirebaseFirestore.DocumentSnapshot): Department {
  const data = doc.data() as Omit<Department, "id" | "createdAt" | "updatedAt"> & {
    createdAt: unknown;
    updatedAt: unknown;
  };
  return {
    ...data,
    id: doc.id,
    createdAt: tsToDate(data.createdAt) ?? new Date(0),
    updatedAt: tsToDate(data.updatedAt) ?? new Date(0),
  };
}

export async function findDepartmentById(id: string): Promise<Department | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.DEPARTMENTS).doc(id).get();
  return doc.exists ? fromDoc(doc) : null;
}

export async function listDepartments(): Promise<Department[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.DEPARTMENTS).orderBy("departmentName", "asc").get();
  return snapshot.docs.map(fromDoc);
}

export async function listDepartmentsByBranch(branchId: string): Promise<Department[]> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.DEPARTMENTS)
    .where("branchId", "==", branchId)
    .orderBy("departmentName", "asc")
    .get();
  return snapshot.docs.map(fromDoc);
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
  const db = getDb();
  const existing = await db
    .collection(COLLECTIONS.DEPARTMENTS)
    .where("branchId", "==", args.branchId)
    .where("departmentCode", "==", args.departmentCode)
    .limit(1)
    .get();
  if (!existing.empty) {
    throw new DuplicateDepartmentCodeError();
  }

  const now = new Date();
  const doc = {
    branchId: args.branchId,
    departmentCode: args.departmentCode,
    departmentName: args.departmentName,
    status: args.status,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTIONS.DEPARTMENTS).add(doc);
  return { ...doc, id: ref.id };
}

export interface UpdateDepartmentArgs {
  branchId: string;
  departmentCode: string;
  departmentName: string;
  status: "ACTIVE" | "INACTIVE";
}

export async function updateDepartment(id: string, args: UpdateDepartmentArgs): Promise<void> {
  const db = getDb();
  const existing = await db
    .collection(COLLECTIONS.DEPARTMENTS)
    .where("branchId", "==", args.branchId)
    .where("departmentCode", "==", args.departmentCode)
    .limit(1)
    .get();
  if (!existing.empty && existing.docs[0].id !== id) {
    throw new DuplicateDepartmentCodeError();
  }

  await db
    .collection(COLLECTIONS.DEPARTMENTS)
    .doc(id)
    .update({
      branchId: args.branchId,
      departmentCode: args.departmentCode,
      departmentName: args.departmentName,
      status: args.status,
      updatedAt: new Date(),
    });
}

export class DepartmentInUseError extends Error {
  constructor() {
    super("This department still has devices assigned to it.");
  }
}

export async function deleteDepartment(id: string): Promise<void> {
  const db = getDb();

  const devices = await db.collection(COLLECTIONS.DEVICES).where("departmentId", "==", id).limit(1).get();
  if (!devices.empty) {
    throw new DepartmentInUseError();
  }

  await db.collection(COLLECTIONS.DEPARTMENTS).doc(id).delete();
}
