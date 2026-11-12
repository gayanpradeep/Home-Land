import { config } from "dotenv";
config({ path: ".env.local" });

const BRANCHES = [
  { branchCode: "BR01", branchName: "Colombo Head Branch", address: "Colombo" },
  { branchCode: "BR02", branchName: "Kandy Branch", address: "Kandy" },
  { branchCode: "BR03", branchName: "Galle Branch", address: "Galle" },
  { branchCode: "BR04", branchName: "Kurunegala Branch", address: "Kurunegala" },
  { branchCode: "BR05", branchName: "Anuradhapura Branch", address: "Anuradhapura" },
  { branchCode: "BR06", branchName: "Jaffna Branch", address: "Jaffna" },
  { branchCode: "BR07", branchName: "Matara Branch", address: "Matara" },
  { branchCode: "BR08", branchName: "Negombo Branch", address: "Negombo" },
  { branchCode: "BR09", branchName: "Ratnapura Branch", address: "Ratnapura" },
  { branchCode: "BR10", branchName: "Batticaloa Branch", address: "Batticaloa" },
  { branchCode: "BR11", branchName: "Badulla Branch", address: "Badulla" },
  { branchCode: "BR12", branchName: "Trincomalee Branch", address: "Trincomalee" },
  { branchCode: "BR13", branchName: "Kalutara Branch", address: "Kalutara" },
  { branchCode: "BR14", branchName: "Gampaha Branch", address: "Gampaha" },
  { branchCode: "BR15", branchName: "Nuwara Eliya Branch", address: "Nuwara Eliya" },
  { branchCode: "BR16", branchName: "Polonnaruwa Branch", address: "Polonnaruwa" },
  { branchCode: "BR17", branchName: "Vavuniya Branch", address: "Vavuniya" },
  { branchCode: "BR18", branchName: "Hambantota Branch", address: "Hambantota" },
  { branchCode: "BR19", branchName: "Kegalle Branch", address: "Kegalle" },
  { branchCode: "BR20", branchName: "Monaragala Branch", address: "Monaragala" },
];

async function main() {
  const { db } = await import("../src/lib/db");
  let created = 0;

  for (const branch of BRANCHES) {
    const existing = await db.branch.findUnique({ where: { branchCode: branch.branchCode } });
    if (existing) {
      await db.branch.update({ where: { id: existing.id }, data: {} });
      continue;
    }
    await db.branch.create({
      data: { ...branch, contactPhone: "", status: "ACTIVE" },
    });
    created += 1;
  }

  console.log(`Seeded ${BRANCHES.length} branches (${created} newly created).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
