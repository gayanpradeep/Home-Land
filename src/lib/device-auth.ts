import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { DEVICE_COOKIE_NAME } from "@/lib/constants";
import { findDeviceByTokenHash, touchLastSeen } from "@/repositories/device.repository";
import { isDevBypassEnabled, getDevBypassDevice } from "@/lib/dev-bypass";
import type { Device } from "@/types/models";

const DEVICE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year; revoked via admin device status, not expiry.

export function generateDeviceSecret(): string {
  return randomBytes(32).toString("hex");
}

export function hashDeviceSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

/** Called once during on-site kiosk activation. Stores the raw secret in an HttpOnly cookie. */
export async function setDeviceCookie(secret: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearDeviceCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEVICE_COOKIE_NAME);
}

/**
 * Resolves the authenticated device strictly from its HttpOnly credential cookie.
 * Never trust branchId/departmentId/deviceId supplied by the request body or query string.
 */
export async function getAuthenticatedDevice(): Promise<Device | null> {
  if (isDevBypassEnabled()) {
    return getDevBypassDevice();
  }

  const cookieStore = await cookies();
  const secret = cookieStore.get(DEVICE_COOKIE_NAME)?.value;
  if (!secret) return null;

  const device = await findDeviceByTokenHash(hashDeviceSecret(secret));
  if (!device || device.status !== "ACTIVE") return null;

  if (device.id) {
    void touchLastSeen(device.id); // fire-and-forget; must not slow down rating submission
  }

  return device;
}
