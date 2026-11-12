import { config } from "dotenv";
config({ path: ".env.local" });
import { NEGATIVE_FEEDBACK_REASONS } from "../src/lib/constants";

async function main() {
  const { db } = await import("../src/lib/db");
  const existing = await db.feedbackReason.findFirst();
  if (existing) {
    console.log("Feedback reasons already exist. No changes made.");
    return;
  }

  await db.feedbackReason.createMany({
    data: NEGATIVE_FEEDBACK_REASONS.map((reason) => ({
      code: reason.code,
      label: reason.label,
      status: "ACTIVE" as const,
    })),
  });

  console.log(`Seeded ${NEGATIVE_FEEDBACK_REASONS.length} default feedback reasons.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
