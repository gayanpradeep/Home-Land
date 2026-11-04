import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/csrf";
import { createDeviceSchema } from "@/lib/validations";
import { generateDeviceSecret, hashDeviceSecret } from "@/lib/device-auth";
import {
  listDevices,
  createDevice,
  DuplicateDeviceCodeError,
} from "@/repositories/device.repository";
import { listBranches } from "@/repositories/branch.repository";
import { listDepartments } from "@/repositories/department.repository";
import { isDevBypassEnabled } from "@/lib/dev-bypass";

const PREVIEW_DEVICES = [
  {
    id: "preview-device-0",
    deviceCode: "KIOSK-01",
    counterName: "Service Counter 01",
    branchName: "Colombo Head Branch",
    departmentName: "Sales",
    status: "ACTIVE" as const,
    lastSeenAt: null,
  },
];

export async function GET() {
  try {
    await requireAdmin();

    if (isDevBypassEnabled()) {
      return NextResponse.json(PREVIEW_DEVICES);
    }

    const [devices, branches, departments] = await Promise.all([
      listDevices(),
      listBranches(),
      listDepartments(),
    ]);

    const branchNameById = new Map(branches.map((b) => [b.id, b.branchName]));
    const departmentNameById = new Map(departments.map((d) => [d.id, d.departmentName]));

    return NextResponse.json(
      devices.map((d) => ({
        id: d.id,
        deviceCode: d.deviceCode,
        counterName: d.counterName,
        branchName: branchNameById.get(d.branchId) ?? "Unknown",
        departmentName: departmentNameById.get(d.departmentId) ?? "Unknown",
        status: d.status,
        lastSeenAt: d.lastSeenAt,
      })),
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to load devices." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    if (isDevBypassEnabled()) {
      return NextResponse.json(
        { error: "Registering devices is disabled in preview mode (no database connected)." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const input = createDeviceSchema.parse(body);

    const secret = generateDeviceSecret();
    const now = new Date();

    const device = await createDevice({
      deviceCode: input.deviceCode,
      deviceName: input.counterName,
      branchId: input.branchId,
      departmentId: input.departmentId,
      counterName: input.counterName,
      deviceTokenHash: hashDeviceSecret(secret),
      status: input.status,
      lastSeenAt: null,
      createdAt: now,
      updatedAt: now,
    });

    // The raw secret is returned exactly once here and is never stored or
    // retrievable again — only its hash lives in the database.
    return NextResponse.json(
      { device: { id: device.id, deviceCode: device.deviceCode }, activationSecret: secret },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    if (error instanceof DuplicateDeviceCodeError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid device details.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to register device." }, { status: 500 });
  }
}
