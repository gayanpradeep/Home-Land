import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { Device } from "@/types/models";

export async function findDeviceByCode(deviceCode: string): Promise<Device | null> {
  const db = await getDb();
  return db.collection<Device>(COLLECTIONS.DEVICES).findOne({ deviceCode });
}

export async function findDeviceByTokenHash(deviceTokenHash: string): Promise<Device | null> {
  const db = await getDb();
  return db.collection<Device>(COLLECTIONS.DEVICES).findOne({ deviceTokenHash });
}

export async function findDeviceById(id: ObjectId | string): Promise<Device | null> {
  const db = await getDb();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  return db.collection<Device>(COLLECTIONS.DEVICES).findOne({ _id });
}

export async function listDevices(): Promise<Device[]> {
  const db = await getDb();
  return db.collection<Device>(COLLECTIONS.DEVICES).find({}).sort({ deviceCode: 1 }).toArray();
}

export async function createDevice(doc: Device): Promise<Device> {
  const db = await getDb();
  const result = await db.collection<Device>(COLLECTIONS.DEVICES).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function touchLastSeen(deviceId: ObjectId): Promise<void> {
  const db = await getDb();
  await db
    .collection<Device>(COLLECTIONS.DEVICES)
    .updateOne({ _id: deviceId }, { $set: { lastSeenAt: new Date() } });
}
