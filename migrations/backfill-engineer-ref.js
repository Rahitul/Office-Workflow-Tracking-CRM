const mongoose = require("mongoose")

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/iomdaily"

async function migrate() {
  console.log("Connecting to MongoDB...")
  await mongoose.connect(MONGO_URI)
  console.log("Connected.\n")

  console.log("=== Backfilling engineer ObjectId for existing quotations ===\n")

  const quotations = await mongoose.connection.db
    .collection("quotations")
    .find({ $or: [{ engineer: { $exists: false } }, { engineer: null }] })
    .toArray()

  console.log(`Found ${quotations.length} quotations without engineer field.\n`)

  let updated = 0
  let skipped = 0

  for (const q of quotations) {
    const name = q.engineerName
    if (!name) { skipped++; continue }

    const user = await mongoose.connection.db
      .collection("users")
      .findOne({ name })

    if (user) {
      await mongoose.connection.db
        .collection("quotations")
        .updateOne(
          { _id: q._id },
          { $set: { engineer: user._id } }
        )
      updated++
      console.log(`  ✓ ${q.quotationId || q._id} → engineer: ${user.name} (${user._id})`)
    } else {
      skipped++
      console.log(`  ✗ ${q.quotationId || q._id} → no user found for name "${name}"`)
    }
  }

  console.log(`\nDone. ${updated} updated, ${skipped} skipped.`)

  await mongoose.disconnect()
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
