import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { updateDeviceStatus, deleteDevice, findDeviceById } from "@/repositories/device.repository";

const patchSchema = z.object({ status: z.enum(["ACTIVE", "INACTIVE"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = patchSchema.parse(body);

    await updateDeviceStatus(id, status);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to update device." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const { id } = await params;
    const device = await findDeviceById(id);
    if (!device) {
      return NextResponse.json({ error: "Device not found." }, { status: 404 });
    }
    // Deleting an active device would silently orphan a live kiosk credential —
    // require it to be deactivated first.
    if (device.status !== "INACTIVE") {
      return NextResponse.json(
        { error: "Deactivate this device before deleting it." },
        { status: 409 },
      );
    }

    await deleteDevice(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to delete device." }, { status: 500 });
  }
}
