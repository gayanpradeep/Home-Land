import { config } from "dotenv";
config({ path: ".env.local" });
import { getDb } from "../src/lib/firebase";
import { COLLECTIONS } from "../src/lib/constants";

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
  const db = getDb();
  const now = new Date();
  const collection = db.collection(COLLECTIONS.BRANCHES);

  let created = 0;
  for (const branch of BRANCHES) {
    const existing = await collection.where("branchCode", "==", branch.branchCode).limit(1).get();
    if (!existing.empty) {
      await existing.docs[0].ref.update({ updatedAt: now });
      continue;
    }
    await collection.add({
      ...branch,
      contactPhone: "",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
    created += 1;
  }

  console.log(`Seeded ${BRANCHES.length} branches (${created} newly created).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
