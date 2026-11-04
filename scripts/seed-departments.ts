import { config } from "dotenv";
config({ path: ".env.local" });
import { getDb } from "../src/lib/firebase";
import { COLLECTIONS, DEFAULT_DEPARTMENTS } from "../src/lib/constants";

function toCode(name: string): string {
  return name.toUpperCase().replace(/[^A-Z]+/g, "_").replace(/^_|_$/g, "");
}

async function main() {
  const db = getDb();
  const now = new Date();

  const branchesSnapshot = await db.collection(COLLECTIONS.BRANCHES).get();
  if (branchesSnapshot.empty) {
    throw new Error("No branches found. Run seed-branches.ts first.");
  }

  const departmentsCollection = db.collection(COLLECTIONS.DEPARTMENTS);
  let count = 0;

  for (const branchDoc of branchesSnapshot.docs) {
    for (const deptName of DEFAULT_DEPARTMENTS) {
      const departmentCode = toCode(deptName);
      const existing = await departmentsCollection
        .where("branchId", "==", branchDoc.id)
        .where("departmentCode", "==", departmentCode)
        .limit(1)
        .get();

      if (!existing.empty) {
        await existing.docs[0].ref.update({ updatedAt: now });
      } else {
        await departmentsCollection.add({
          branchId: branchDoc.id,
          departmentCode,
          departmentName: deptName,
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now,
        });
      }
      count += 1;
    }
  }

  console.log(`Seeded ${count} department records across ${branchesSnapshot.size} branches.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
