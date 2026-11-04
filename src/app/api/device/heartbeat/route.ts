import { NextResponse } from "next/server";
import { getAuthenticatedDevice } from "@/lib/device-auth";

export async function POST() {
  const device = await getAuthenticatedDevice();
  if (!device) {
    return NextResponse.json({ error: "Device is not activated." }, { status: 401 });
  }
  // getAuthenticatedDevice() already touches lastSeenAt.
  return NextResponse.json({ success: true });
}
