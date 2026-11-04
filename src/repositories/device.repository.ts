import { getDb, tsToDate } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { Device } from "@/types/models";

function fromDoc(doc: FirebaseFirestore.DocumentSnapshot): Device {
  const data = doc.data() as Omit<Device, "id" | "createdAt" | "updatedAt" | "lastSeenAt"> & {
    createdAt: unknown;
    updatedAt: unknown;
    lastSeenAt: unknown;
  };
  return {
    ...data,
    id: doc.id,
    createdAt: tsToDate(data.createdAt) ?? new Date(0),
    updatedAt: tsToDate(data.updatedAt) ?? new Date(0),
    lastSeenAt: tsToDate(data.lastSeenAt),
  };
}

export async function findDeviceByCode(deviceCode: string): Promise<Device | null> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.DEVICES)
    .where("deviceCode", "==", deviceCode)
    .limit(1)
    .get();
  return snapshot.empty ? null : fromDoc(snapshot.docs[0]);
}

export async function findDeviceByTokenHash(deviceTokenHash: string): Promise<Device | null> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.DEVICES)
    .where("deviceTokenHash", "==", deviceTokenHash)
    .limit(1)
    .get();
  return snapshot.empty ? null : fromDoc(snapshot.docs[0]);
}

export async function findDeviceById(id: string): Promise<Device | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.DEVICES).doc(id).get();
  return doc.exists ? fromDoc(doc) : null;
}

export async function listDevices(): Promise<Device[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.DEVICES).orderBy("deviceCode", "asc").get();
  return snapshot.docs.map(fromDoc);
}

export class DuplicateDeviceCodeError extends Error {
  constructor() {
    super("Device code is already in use.");
  }
}

export async function createDevice(doc: Device): Promise<Device> {
  const db = getDb();
  const existing = await findDeviceByCode(doc.deviceCode);
  if (existing) {
    throw new DuplicateDeviceCodeError();
  }

  const { id, ...data } = doc;
  void id;
  const ref = await db.collection(COLLECTIONS.DEVICES).add(data);
  return { ...doc, id: ref.id };
}

export async function touchLastSeen(deviceId: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.DEVICES).doc(deviceId).update({ lastSeenAt: new Date() });
}

export async function updateDeviceStatus(deviceId: string, status: "ACTIVE" | "INACTIVE"): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.DEVICES).doc(deviceId).update({ status, updatedAt: new Date() });
}

export async function deleteDevice(deviceId: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.DEVICES).doc(deviceId).delete();
}
