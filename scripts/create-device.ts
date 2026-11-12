import { config } from "dotenv";
config({ path: ".env.local" });
import { generateDeviceSecret, hashDeviceSecret } from "../src/lib/device-auth";

// One-off dev helper: registers a kiosk device against the first seeded branch/department
// and prints the activation secret once (it is never stored anywhere, only its hash is).
// Usage: npx tsx scripts/create-device.ts [branchCode] [departmentCode] [deviceCode] [counterName]
async function main() {
  const { db } = await import("../src/lib/db");
  const [branchCode = "BR01", departmentCode = "SALES", deviceCode = "KIOSK-01", counterName = "Service Counter 01"] =
    process.argv.slice(2);

  const branch = await db.branch.findUnique({ where: { branchCode } });
  if (!branch) {
    throw new Error(`No branch found with branchCode "${branchCode}". Run seed-branches.ts first.`);
  }

  const department = await db.department.findUnique({
    where: { branchId_departmentCode: { branchId: branch.id, departmentCode } },
  });
  if (!department) {
    throw new Error(`No department "${departmentCode}" found under branch "${branchCode}". Run seed-departments.ts first.`);
  }

  const existing = await db.device.findUnique({ where: { deviceCode } });
  if (existing) {
    console.log(`Device "${deviceCode}" already exists. Delete it first if you want a new activation secret.`);
    return;
  }

  const secret = generateDeviceSecret();

  await db.device.create({
    data: {
      deviceCode,
      deviceName: `${branch.branchName} - ${department.departmentName}`,
      branchId: branch.id,
      departmentId: department.id,
      counterName,
      deviceTokenHash: hashDeviceSecret(secret),
      status: "ACTIVE",
      lastSeenAt: null,
    },
  });

  console.log("Device created. Enter these on the kiosk's activation screen (shown once only):");
  console.log(`  Device Code:       ${deviceCode}`);
  console.log(`  Activation Secret: ${secret}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
