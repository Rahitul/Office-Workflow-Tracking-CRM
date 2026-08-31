import { connectDB } from "@/lib/db"
import { Machine } from "@/models/Machine"
import { sendWarrantyExpiryEmail } from "@/lib/email"

const NOTIFY_WINDOW_DAYS = 15

let running = false

export async function runWarrantyCheck() {
  if (running) {
    console.log("Warranty check skipped: another run is already in progress")
    return { checked: 0, sent: 0, failed: 0, skipped: true }
  }

  running = true

  const result = { checked: 0, sent: 0, failed: 0 }

  try {
    await connectDB()

    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const end = new Date(start.getTime() + NOTIFY_WINDOW_DAYS * 86400000)

    const machines = await Machine.find({
      warrantyExpired: { $gte: start, $lte: end },
      email: { $ne: "" },
      warrantyNotified: { $ne: true },
    }).select(
      "machineId customerName brandName modelName serialNumber productCategory department location contactPerson contactNumber email billDate warrantyExpired"
    )

    result.checked = machines.length
    console.log(`Warranty check: ${machines.length} machine(s) expiring within ${NOTIFY_WINDOW_DAYS} days`)

    for (const machine of machines) {
      if (!machine.warrantyExpired) continue
      const daysLeft = Math.round((machine.warrantyExpired.getTime() - start.getTime()) / 86400000)

      const sent = await sendWarrantyExpiryEmail({
        to: machine.email,
        machine,
        daysLeft,
      })

      if (sent) {
        try {
          machine.warrantyNotified = true
          await machine.save()
          result.sent += 1
        } catch (saveError) {
          console.error("Warranty flag save error:", saveError)
          result.failed += 1
        }
      } else {
        result.failed += 1
      }
    }

    console.log(`Warranty check done: ${result.sent} sent, ${result.failed} failed`)
  } catch (error) {
    console.error("Warranty check error:", error)
  } finally {
    running = false
  }

  return result
}
