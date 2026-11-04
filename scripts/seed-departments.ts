import "dotenv/config";
import { MongoClient } from "mongodb";
import { COLLECTIONS, DEFAULT_DEPARTMENTS } from "../src/lib/constants";

function toCode(name: string): string {
  return name.toUpperCase().replace(/[^A-Z]+/g, "_").replace(/^_|_$/g, "");
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "homelands_rating_db";
  if (!uri) throw new Error("MONGODB_URI is not set in .env.local");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date();

  const branches = await db.collection(COLLECTIONS.BRANCHES).find({}).toArray();
  if (branches.length === 0) {
    throw new Error("No branches found. Run seed-branches.ts first.");
  }

  let count = 0;
  for (const branch of branches) {
    for (const deptName of DEFAULT_DEPARTMENTS) {
      const departmentCode = toCode(deptName);
      await db.collection(COLLECTIONS.DEPARTMENTS).updateOne(
        { branchId: branch._id, departmentCode },
        {
          $setOnInsert: {
            branchId: branch._id,
            departmentCode,
            departmentName: deptName,
            isActive: true,
            createdAt: now,
          },
          $set: { updatedAt: now },
        },
        { upsert: true },
      );
      count += 1;
    }
  }

  console.log(`Seeded ${count} department records across ${branches.length} branches.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
