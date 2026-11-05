import { config } from "dotenv";
config({ path: ".env.local" });
import { getDb } from "../src/lib/firebase";
import { COLLECTIONS } from "../src/lib/constants";
import { NEGATIVE_FEEDBACK_REASONS } from "../src/lib/constants";

async function main() {
  const db = getDb();

  const existing = await db.collection(COLLECTIONS.FEEDBACK_REASONS).limit(1).get();
  if (!existing.empty) {
    console.log("Feedback reasons already exist. No changes made.");
    return;
  }

  const now = new Date();
  const batch = db.batch();

  for (const reason of NEGATIVE_FEEDBACK_REASONS) {
    const ref = db.collection(COLLECTIONS.FEEDBACK_REASONS).doc();
    batch.set(ref, {
      code: reason.code,
      label: reason.label,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
  console.log(`Seeded ${NEGATIVE_FEEDBACK_REASONS.length} default feedback reasons.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
