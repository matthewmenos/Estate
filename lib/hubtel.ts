/**
 * Hubtel Receive Money API (mobile money).
 *
 * Sends a payment prompt to a customer's phone; they approve it on their
 * handset (MTN MoMo, Vodafone Cash, AirtelTigo Money). Hubtel then calls
 * our callback URL with the result.
 *
 * Credentials come from your Hubtel merchant dashboard (unity.hubtel.com):
 * a Client ID + Client Secret (used as HTTP Basic Auth), and your POS Sales
 * ID identifying the merchant account to receive funds into.
 *
 * NOTE: the field names below follow Hubtel's publicly documented Receive
 * Money request shape. Hubtel's full reference sits behind a login-gated
 * developer portal — worth a quick diff against your own dashboard docs
 * once you have real credentials, in case anything has shifted.
 */

const HUBTEL_BASE_URL = "https://rmp.hubtel.com";

function authHeader() {
  const clientId = process.env.HUBTEL_CLIENT_ID!;
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET!;
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  return `Basic ${token}`;
}

// Ghana network channel codes Hubtel expects.
export type MomoChannel = "mtn-gh" | "vodafone-gh" | "tigo-gh";

export function guessChannel(phone: string): MomoChannel {
  const digits = phone.replace(/\D/g, "").slice(-9); // last 9 digits, network-agnostic of country code
  const prefix = digits.slice(0, 2);
  // Common Ghana MoMo prefixes — approximate; let the owner override if wrong.
  if (["24", "54", "55", "59"].includes(prefix)) return "mtn-gh";
  if (["20", "50"].includes(prefix)) return "vodafone-gh";
  if (["27", "57", "26", "56"].includes(prefix)) return "tigo-gh";
  return "mtn-gh";
}

export async function initiateMobileMoneyCharge(params: {
  customerName: string;
  customerPhone: string; // e.g. +233241234567
  channel: MomoChannel;
  amount: number;
  clientReference: string; // must be unique per attempt
  description: string;
}) {
  const posSalesId = process.env.HUBTEL_POS_SALES_ID!;
  const callbackUrl = `${process.env.APP_BASE_URL}/api/payments/callback`;

  const res = await fetch(
    `${HUBTEL_BASE_URL}/merchantaccount/merchants/${posSalesId}/receive/mobilemoney`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        CustomerName: params.customerName,
        CustomerMsisdn: params.customerPhone.replace(/\D/g, ""),
        Channel: params.channel,
        Amount: params.amount,
        PrimaryCallbackUrl: callbackUrl,
        Description: params.description,
        ClientReference: params.clientReference,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.Message || "Hubtel charge request failed");
  }
  return data as {
    ResponseCode: string;
    Status: string;
    Data?: { TransactionId?: string };
  };
}
