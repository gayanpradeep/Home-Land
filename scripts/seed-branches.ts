import "dotenv/config";
import { MongoClient } from "mongodb";
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
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "homelands_rating_db";
  if (!uri) throw new Error("MONGODB_URI is not set in .env.local");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date();

  for (const branch of BRANCHES) {
    await db.collection(COLLECTIONS.BRANCHES).updateOne(
      { branchCode: branch.branchCode },
      {
        $setOnInsert: {
          ...branch,
          contactPhone: "",
          contactEmail: "",
          isActive: true,
          createdAt: now,
        },
        $set: { updatedAt: now },
      },
      { upsert: true },
    );
  }

  console.log(`Seeded ${BRANCHES.length} branches.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
