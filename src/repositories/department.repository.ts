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
