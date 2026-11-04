import { writeFileSync } from "fs";
import { resolve } from "path";

// Firestore composite indexes are declarative (deployed via the Firebase CLI or
// created on-demand from the link Firestore prints in a FAILED_PRECONDITION error),
// not created imperatively like MongoDB's createIndex(). This script writes out
// firestore.indexes.json with the composite indexes this app's queries need; deploy
// with `firebase deploy --only firestore:indexes` once you have the Firebase CLI
// set up and are logged into this project.
//
// Single-field equality/range queries (e.g. find by username, deviceCode,
// tokenHash, deviceTokenHash) do not need a composite index — Firestore creates
// single-field indexes automatically.

const indexes = {
  indexes: [
    {
      collectionGroup: "departments",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "branchId", order: "ASCENDING" },
        { fieldPath: "departmentName", order: "ASCENDING" },
      ],
    },
    {
      collectionGroup: "departments",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "branchId", order: "ASCENDING" },
        { fieldPath: "departmentCode", order: "ASCENDING" },
      ],
    },
    {
      collectionGroup: "users",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "userType", order: "ASCENDING" },
        { fieldPath: "status", order: "ASCENDING" },
      ],
    },
    {
      collectionGroup: "ratings",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "branchId", order: "ASCENDING" },
        { fieldPath: "submittedAt", order: "ASCENDING" },
      ],
    },
    {
      collectionGroup: "ratings",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "departmentId", order: "ASCENDING" },
        { fieldPath: "submittedAt", order: "ASCENDING" },
      ],
    },
    {
      collectionGroup: "sessions",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "userId", order: "ASCENDING" },
        { fieldPath: "revokedAt", order: "ASCENDING" },
      ],
    },
  ],
  fieldOverrides: [],
};

const outPath = resolve(__dirname, "..", "firestore.indexes.json");
writeFileSync(outPath, JSON.stringify(indexes, null, 2) + "\n");

console.log(`Wrote ${outPath}`);
console.log("Deploy with: firebase deploy --only firestore:indexes");
console.log(
  "Until deployed, affected queries will fail with FAILED_PRECONDITION and a " +
    "console link to create that specific index on demand.",
);
