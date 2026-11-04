import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { Department } from "@/types/models";

export async function findDepartmentById(id: ObjectId | string): Promise<Department | null> {
  const db = await getDb();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  return db.collection<Department>(COLLECTIONS.DEPARTMENTS).findOne({ _id });
}

export async function listDepartments(): Promise<Department[]> {
  const db = await getDb();
  return db.collection<Department>(COLLECTIONS.DEPARTMENTS).find({}).sort({ departmentName: 1 }).toArray();
}

export async function listDepartmentsByBranch(branchId: ObjectId): Promise<Department[]> {
  const db = await getDb();
  return db
    .collection<Department>(COLLECTIONS.DEPARTMENTS)
    .find({ branchId })
    .sort({ departmentName: 1 })
    .toArray();
}
