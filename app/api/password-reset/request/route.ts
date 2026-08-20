import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { sendPhoneOtp, normalizeGhanaPhone } from "@/lib/arkesel";
import { checkRateLimit } from "@/lib/rateLimit";

const GENERIC_RESPONSE = {
  success: true,
  message: "If that number is registered, a code has been sent.",
};

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    const normalized = normalizeGhanaPhone(phone);

    // Rate limit before doing anything else — without this, someone could
    // spam Arkesel sends (and cost) against any phone number. Deliberately
    // still returns the same generic response when rate-limited, matching
    // the existing "never reveal anything via this endpoint" design below —
    // it just silently skips the actual send.
    const allowed = await checkRateLimit(`password-reset-request:${normalized}`, 3, 15 * 60);
    if (!allowed) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const supabase = supabaseServer();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", normalized)
      .eq("phone_verified", true)
      .maybeSingle();

    // Only send a code if a verified account actually owns this number —
    // but always return the same generic response either way, so this
    // endpoint can't be used to check which phone numbers have accounts.
    if (profile) {
      await sendPhoneOtp(normalized);
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (err: any) {
    console.error("Password reset request failed:", err);
    // Still return a generic success shape to avoid leaking anything via errors.
    return NextResponse.json(GENERIC_RESPONSE);
  }
}
