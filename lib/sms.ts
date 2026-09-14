import axios from "axios"

const GENNET_API_URL = process.env.GENNET_SMS_API_URL || "https://isms.gennet.com.bd/api/v3/send-sms"
const GENNET_API_TOKEN = process.env.GENNET_SMS_API_TOKEN || "$2y$12$lc5cdIA5MGnG9ONKZmVZKOUDfQ//J1FWlZH6oghg4G7w6yeayWk.W"
const GENNET_SID = process.env.GENNET_SMS_SID || "ESBDnonmask"

if (GENNET_API_TOKEN) {
  console.log("[SMS] Token loaded:", GENNET_API_TOKEN.slice(0, 12) + "...")
} else {
  console.warn("[SMS] GENNET_SMS_API_TOKEN is EMPTY")
}

export function normalizePhone(phone: string): string | null {
  if (!phone) return null
  let p = phone.replace(/\s|-|\(|\)/g, "")
  if (p.startsWith("+880")) p = p.slice(1)
  else if (p.startsWith("880")) p = p
  else if (p.startsWith("0")) p = "880" + p.slice(1)
  else if (p.startsWith("1")) p = "880" + p
  else return null
  if (!/^880\d{10}$/.test(p)) return null
  return p
}

function generateCsmsId(): string {
  const hex = Date.now().toString(36) + Math.random().toString(16).slice(2, 10)
  return hex.toUpperCase().slice(0, 20)
}

export async function sendAssignmentSMS({
  to,
  task,
}: {
  to: string
  task: { taskId?: string }
}): Promise<void> {
  if (!GENNET_API_TOKEN) {
    console.warn("[SMS] GENNET_SMS_API_TOKEN not set, skipping SMS")
    return
  }
  const msisdn = normalizePhone(to)
  if (!msisdn) {
    console.warn(`[SMS] Invalid phone number: ${to}, skipping`)
    return
  }
  const taskId = task.taskId || "N/A"
  const sms = `New Case Assigned. Id:${taskId}, Link: http://182.160.108.210:4002/`
  const csms_id = generateCsmsId()

  try {
    const res = await axios.post(
      GENNET_API_URL,
      { api_token: GENNET_API_TOKEN, sid: GENNET_SID, msisdn, sms, csms_id },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    )
    const data = res.data
    if (data.status === "SUCCESS") {
      console.log(`[SMS] Sent to ${msisdn} (csms_id: ${csms_id})`)
    } else {
      console.error(`[SMS] Failed: ${data.error_message || data.status} (csms_id: ${csms_id})`)
    }
  } catch (error: any) {
    console.error(`[SMS] Error sending to ${msisdn}:`, error.message || error)
  }
}
