import { config } from "dotenv";
config({ path: ".env.local" });
import { getDb } from "../src/lib/firebase";
import { COLLECTIONS } from "../src/lib/constants";
import { generateDeviceSecret, hashDeviceSecret } from "../src/lib/device-auth";

// One-off dev helper: registers a kiosk device against the first seeded branch/department
// and prints the activation secret once (it is never stored anywhere, only its hash is).
// Usage: npx tsx scripts/create-device.ts [branchCode] [departmentCode] [deviceCode] [counterName]
async function main() {
  const [branchCode = "BR01", departmentCode = "SALES", deviceCode = "KIOSK-01", counterName = "Service Counter 01"] =
    process.argv.slice(2);

  const db = getDb();

  const branchSnap = await db.collection(COLLECTIONS.BRANCHES).where("branchCode", "==", branchCode).limit(1).get();
  if (branchSnap.empty) {
    throw new Error(`No branch found with branchCode "${branchCode}". Run seed-branches.ts first.`);
  }
  const branch = branchSnap.docs[0];

  const deptSnap = await db
    .collection(COLLECTIONS.DEPARTMENTS)
    .where("branchId", "==", branch.id)
    .where("departmentCode", "==", departmentCode)
    .limit(1)
    .get();
  if (deptSnap.empty) {
    throw new Error(`No department "${departmentCode}" found under branch "${branchCode}". Run seed-departments.ts first.`);
  }
  const department = deptSnap.docs[0];

  const existing = await db.collection(COLLECTIONS.DEVICES).where("deviceCode", "==", deviceCode).limit(1).get();
  if (!existing.empty) {
    console.log(`Device "${deviceCode}" already exists. Delete it first if you want a new activation secret.`);
    return;
  }

  const secret = generateDeviceSecret();
  const now = new Date();

  await db.collection(COLLECTIONS.DEVICES).add({
    deviceCode,
    deviceName: `${branch.data().branchName} - ${department.data().departmentName}`,
    branchId: branch.id,
    departmentId: department.id,
    counterName,
    deviceTokenHash: hashDeviceSecret(secret),
    status: "ACTIVE",
    lastSeenAt: null,
    createdAt: now,
    updatedAt: now,
  });

  console.log("Device created. Enter these on the kiosk's activation screen (shown once only):");
  console.log(`  Device Code:       ${deviceCode}`);
  console.log(`  Activation Secret: ${secret}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
