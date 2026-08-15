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

// Arkesel can return HTTP 200 with a logical error in the body — {"code":
// "1001", "message": "..."} — so a successful fetch is NOT the same as a
// successful request. This is the one error code Arkesel's docs confirm the
// meaning of; anything else falls back to their own message field rather
// than a guessed explanation.
const KNOWN_ERROR_CODES: Record<string, string> = {
  "1001": "Validation error — a required field is missing from the request to Arkesel.",
};

function getApiKey() {
  const key = process.env.ARKESEL_API_KEY;
  if (!key) {
    // Fail fast and specifically, instead of letting this surface later as
    // an opaque 401 from Arkesel that looks like a code bug.
    throw new Error(
      "ARKESEL_API_KEY is not set. Add it to .env.local — see .env.example."
    );
  }
  return key;
}

function getSenderId() {
  // Configurable via env rather than hardcoded, since the sender ID is
  // registered per-account with Arkesel/the carriers — yours will almost
  // certainly not be "AccraRent" unless you specifically registered that.
  return process.env.ARKESEL_SENDER_ID || "AccraRent";
}

export function normalizeGhanaPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("233")) return `+${digits}`;
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
  return `+${digits}`;
}

/**
 * Retries a transient (network-level) failure once with a short backoff.
 * Does NOT retry logical/validation errors — those won't succeed on retry.
 */
async function fetchWithRetry(url: string, init: RequestInit, attempts = 2): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

function assertSuccess(res: Response, data: any) {
  // A logical error can arrive as HTTP 200 with an error code in the body,
  // so check both — HTTP status alone isn't sufficient.
  const bodyCode = typeof data?.code === "string" ? data.code : null;
  const bodyError = bodyCode && KNOWN_ERROR_CODES[bodyCode];

  if (!res.ok || bodyError) {
    throw new Error(bodyError || data?.message || `Arkesel request failed (HTTP ${res.status})`);
  }
}

export async function sendPhoneOtp(phone: string, medium: "sms" | "voice" = "sms") {
  const res = await fetchWithRetry(`${ARKESEL_BASE_URL}/send`, {
    method: "POST",
    headers: {
      "api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expiry: 5, // minutes
      length: 6,
      medium, // "voice" is Arkesel's documented fallback if SMS delivery is unreliable for a number
      message: "Your Accra Rentals verification code is %otp_code%.",
      number: normalizeGhanaPhone(phone),
      sender_id: getSenderId(),
      type: "numeric",
    }),
  });

  const data = await res.json();
  assertSuccess(res, data);
  return data;
}

export async function verifyPhoneOtp(phone: string, code: string) {
  const res = await fetchWithRetry(`${ARKESEL_BASE_URL}/verify`, {
    method: "POST",
    headers: {
      "api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      number: normalizeGhanaPhone(phone),
      code,
    }),
  });

  const data = await res.json();

  // A wrong/expired code is a normal, expected outcome here (not a thrown
  // error) — so we check success explicitly rather than reusing
  // assertSuccess's throw-on-failure behavior.
  const bodyCode = typeof data?.code === "string" ? data.code : null;
  const verified =
    res.ok &&
    !(bodyCode && KNOWN_ERROR_CODES[bodyCode]) &&
    (data.code === "1100" || data.status === "success" || data.verified === true);

  return { verified, raw: data };
}
