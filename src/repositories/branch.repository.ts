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

export async function findBranchByCode(branchCode: string): Promise<Branch | null> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.BRANCHES)
    .where("branchCode", "==", branchCode)
    .limit(1)
    .get();
  return snapshot.empty ? null : fromDoc(snapshot.docs[0]);
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
  const db = getDb();
  const existing = await findBranchByCode(args.branchCode);
  if (existing) {
    throw new DuplicateBranchCodeError();
  }

  const now = new Date();
  const doc = {
    branchCode: args.branchCode,
    branchName: args.branchName,
    address: args.address,
    contactPhone: args.contactPhone ?? "",
    status: args.status,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(COLLECTIONS.BRANCHES).add(doc);
  return { ...doc, id: ref.id };
}
