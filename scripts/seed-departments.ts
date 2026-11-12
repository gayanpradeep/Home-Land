import { config } from "dotenv";
config({ path: ".env.local" });
import { DEFAULT_DEPARTMENTS } from "../src/lib/constants";

function toCode(name: string): string {
  return name.toUpperCase().replace(/[^A-Z]+/g, "_").replace(/^_|_$/g, "");
}

async function main() {
  const { db } = await import("../src/lib/db");
  const branches = await db.branch.findMany();
  if (branches.length === 0) {
    throw new Error("No branches found. Run seed-branches.ts first.");
  }

  let count = 0;

  for (const branch of branches) {
    for (const deptName of DEFAULT_DEPARTMENTS) {
      const departmentCode = toCode(deptName);
      const existing = await db.department.findUnique({
        where: { branchId_departmentCode: { branchId: branch.id, departmentCode } },
      });

      if (existing) {
        await db.department.update({ where: { id: existing.id }, data: {} });
      } else {
        await db.department.create({
          data: {
            branchId: branch.id,
            departmentCode,
            departmentName: deptName,
            status: "ACTIVE",
          },
        });
      }
      count += 1;
    }
  }

  console.log(`Seeded ${count} department records across ${branches.length} branches.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
