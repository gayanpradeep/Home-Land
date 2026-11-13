import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { activateDeviceSchema } from "@/lib/validations";
import { isSameOriginRequest } from "@/lib/csrf";
import { findDeviceByCode } from "@/repositories/device.repository";
import { hashDeviceSecret, setDeviceCookie } from "@/lib/device-auth";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";
import { isHttpsRequest } from "@/lib/session";

// One-time on-site kiosk setup: exchanges the admin-issued activation secret for a
// long-lived HttpOnly device cookie. Never returns or logs the secret/hash.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { deviceCode, activationSecret } = activateDeviceSchema.parse(body);

    const rateLimitKey = `device-activate:${deviceCode}`;
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const device = await findDeviceByCode(deviceCode);
    if (!device || device.status !== "ACTIVE") {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json({ error: "Invalid device code or activation secret." }, { status: 401 });
    }

    const providedHash = hashDeviceSecret(activationSecret);
    if (providedHash !== device.deviceTokenHash) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json({ error: "Invalid device code or activation secret." }, { status: 401 });
    }

    clearAttempts(rateLimitKey);
    await setDeviceCookie(activationSecret, isHttpsRequest(request));

    return NextResponse.json({ success: true, message: "Device activated." });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid activation request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to activate device." }, { status: 500 });
  }
}
