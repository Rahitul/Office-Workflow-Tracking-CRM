const mongoose = require("mongoose")

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/iomdaily"

async function migrate() {
  console.log("Connecting to MongoDB...")
  await mongoose.connect(MONGO_URI)
  console.log("Connected.\n")

  const result = await mongoose.connection.db
    .collection("quotations")
    .updateMany(
      { $or: [{ category: { $exists: false } }, { category: null }] },
      { $set: { category: "service" } }
    )

  console.log(`Matched ${result.matchedCount} documents`)
  console.log(`Modified ${result.modifiedCount} documents`)
  console.log("Set category='service' on all quotations without a category.\n")

  await mongoose.disconnect()
  console.log("Done.")
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
