/**
 * Arkesel general SMS API — https://sms.arkesel.com/api/v2/sms/send
 *
 * Distinct from lib/arkesel.ts, which only covers the OTP product (send/verify
 * a code). This is for plain notification texts — "you got an inquiry",
 * "rent payment received" — that don't need Arkesel to track/verify a code.
 */

function getApiKey() {
  const key = process.env.ARKESEL_API_KEY;
  if (!key) throw new Error("ARKESEL_API_KEY is not set.");
  return key;
}

function getSenderId() {
  return process.env.ARKESEL_SENDER_ID || "AccraRent";
}

function normalizeGhanaPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("233")) return `+${digits}`;
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
  return `+${digits}`;
}

/**
 * Fire-and-forget notification send. Deliberately swallows errors instead of
 * throwing — a failed notification SMS should never take down the request
 * that triggered it (e.g. a renter submitting an inquiry shouldn't see an
 * error just because the owner's notification text failed to send).
 */
export async function sendNotificationSms(phone: string, message: string) {
  try {
    const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: {
        "api-key": getApiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: getSenderId(),
        message,
        recipients: [normalizeGhanaPhone(phone)],
      }),
    });
    const data = await res.json();
    if (!res.ok || data?.status !== "success") {
      console.error("Notification SMS failed:", data);
    }
  } catch (err) {
    console.error("Notification SMS error:", err);
  }
}
