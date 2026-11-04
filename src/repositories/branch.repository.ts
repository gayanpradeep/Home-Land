import { getDb, tsToDate } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { Branch } from "@/types/models";

function fromDoc(doc: FirebaseFirestore.DocumentSnapshot): Branch {
  const data = doc.data() as Omit<Branch, "id" | "createdAt" | "updatedAt"> & {
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

export async function findBranchById(id: string): Promise<Branch | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.BRANCHES).doc(id).get();
  return doc.exists ? fromDoc(doc) : null;
}

export async function listBranches(): Promise<Branch[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.BRANCHES).orderBy("branchCode", "asc").get();
  return snapshot.docs.map(fromDoc);
}
