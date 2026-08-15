/**
 * Arkesel OTP API — https://sms.arkesel.com/api/v2/otp
 *
 * This is Arkesel's dedicated OTP product (separate from their plain SMS
 * send endpoint): Arkesel generates the code, delivers it, and verifies it
 * server-side, so we never store or compare codes ourselves.
 *
 * Requires your Arkesel *Main* API key (OTP endpoints reject sub/scoped keys).
 * Confirm the current request/response contract in Arkesel's developer docs
 * before shipping — details can shift.
 */

const ARKESEL_BASE_URL = "https://sms.arkesel.com/api/v2/otp";

function normalizeGhanaPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("233")) return `+${digits}`;
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
  return `+${digits}`;
}

export async function sendPhoneOtp(phone: string) {
  const res = await fetch(`${ARKESEL_BASE_URL}/send`, {
    method: "POST",
    headers: {
      "api-key": process.env.ARKESEL_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expiry: 5, // minutes
      length: 6,
      medium: "sms",
      message: "Your Accra Rentals verification code is %otp_code%.",
      number: normalizeGhanaPhone(phone),
      sender_id: "AccraRent", // must be a registered sender ID on your Arkesel account
      type: "numeric",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to send verification code");
  }
  return data;
}

export async function verifyPhoneOtp(phone: string, code: string) {
  const res = await fetch(`${ARKESEL_BASE_URL}/verify`, {
    method: "POST",
    headers: {
      "api-key": process.env.ARKESEL_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      number: normalizeGhanaPhone(phone),
      code,
    }),
  });

  const data = await res.json();
  // Arkesel returns a success/verified indicator — the field name is our
  // best read of their documented shape; worth confirming against a real
  // response once you have API credentials.
  const verified = res.ok && (data.code === "1100" || data.status === "success" || data.verified === true);
  return { verified, raw: data };
}

export { normalizeGhanaPhone };
