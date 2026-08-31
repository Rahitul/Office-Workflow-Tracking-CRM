export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { connectDB } = await import("@/lib/db")
    const { runWarrantyCheck } = await import("@/lib/warranty-notifier")

    try {
      await connectDB()
    } catch (error) {
      console.error("instrumentation: connectDB failed:", error)
      return
    }

    runWarrantyCheck().catch((error) =>
      console.error("instrumentation: initial warranty check failed:", error)
    )

    setInterval(() => {
      runWarrantyCheck().catch((error) =>
        console.error("instrumentation: scheduled warranty check failed:", error)
      )
    }, 24 * 60 * 60 * 1000)
  }
}
