const mongoose = require("mongoose")

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/iomdaily"
const COLLECTIONS = ["branchsalestargets", "branchservicetargets", "branchconsumabletargets"]

async function migrate() {
  console.log("Connecting to MongoDB...")
  await mongoose.connect(MONGO_URI)
  const db = mongoose.connection.db

  for (const colName of COLLECTIONS) {
    const col = db.collection(colName)
    const indexes = await col.indexes()
    const oldIndex = indexes.find(
      (ix) =>
        ix.key &&
        ix.key.branchId === 1 &&
        ix.key.month === 1 &&
        ix.key.year === 1 &&
        !ix.key.userId
    )
    if (oldIndex) {
      console.log(`Dropping old index "${oldIndex.name}" on ${colName}...`)
      await col.dropIndex(oldIndex.name)
      console.log(`  Done.`)
    } else {
      console.log(`No old index found on ${colName}, skipping.`)
    }
  }

  console.log("\nMigration complete. Restart the dev server for new indexes to sync.")
  await mongoose.disconnect()
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
