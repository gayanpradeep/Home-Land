import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { Branch } from "@/types/models";

export async function findBranchById(id: ObjectId | string): Promise<Branch | null> {
  const db = await getDb();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  return db.collection<Branch>(COLLECTIONS.BRANCHES).findOne({ _id });
}

export async function listBranches(): Promise<Branch[]> {
  const db = await getDb();
  return db.collection<Branch>(COLLECTIONS.BRANCHES).find({}).sort({ branchCode: 1 }).toArray();
}
