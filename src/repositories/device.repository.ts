import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { Device } from "@/types/models";

// Until full device registration/credentialing (Phase 5) exists, each branch+department
// gets one auto-provisioned "Counter 01" device so ratings always have a valid deviceId.
// This never trusts anything from the client — branchId/departmentId come from the
// authenticated user record only.
export async function findOrCreateDefaultDevice(
  branchId: ObjectId,
  departmentId: ObjectId,
): Promise<Device> {
  const db = await getDb();
  const collection = db.collection<Device>(COLLECTIONS.DEVICES);

  const existing = await collection.findOne({
    branchId,
    departmentId,
    counterName: "Counter 01",
  });
  if (existing) return existing;

  const now = new Date();
  const deviceCode = `AUTO-${branchId.toString().slice(-6)}-${departmentId.toString().slice(-6)}`;

  const doc: Device = {
    deviceCode,
    deviceName: "Default Counter",
    branchId,
    departmentId,
    counterName: "Counter 01",
    credentialHash: "",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}
