import { db } from "@/lib/db";
import type { Device } from "@/types/models";

export async function findDeviceByCode(deviceCode: string): Promise<Device | null> {
  return db.device.findUnique({ where: { deviceCode } });
}

export async function findDeviceByTokenHash(deviceTokenHash: string): Promise<Device | null> {
  return db.device.findFirst({ where: { deviceTokenHash } });
}

export async function findDeviceById(id: string): Promise<Device | null> {
  return db.device.findUnique({ where: { id } });
}

export async function listDevices(): Promise<Device[]> {
  return db.device.findMany({ orderBy: { deviceCode: "asc" } });
}

export class DuplicateDeviceCodeError extends Error {
  constructor() {
    super("Device code is already in use.");
  }
}

export async function createDevice(doc: Device): Promise<Device> {
  const existing = await findDeviceByCode(doc.deviceCode);
  if (existing) {
    throw new DuplicateDeviceCodeError();
  }

  const { id, ...data } = doc;
  void id;
  return db.device.create({ data });
}

export async function touchLastSeen(deviceId: string): Promise<void> {
  await db.device.update({ where: { id: deviceId }, data: { lastSeenAt: new Date() } });
}

export async function updateDeviceStatus(deviceId: string, status: "ACTIVE" | "INACTIVE"): Promise<void> {
  await db.device.update({ where: { id: deviceId }, data: { status } });
}

export async function deleteDevice(deviceId: string): Promise<void> {
  await db.device.delete({ where: { id: deviceId } });
}
