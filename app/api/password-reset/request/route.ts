import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { sendPhoneOtp, normalizeGhanaPhone } from "@/lib/arkesel";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    const normalized = normalizeGhanaPhone(phone);
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

    return NextResponse.json({
      success: true,
      message: "If that number is registered, a code has been sent.",
    });
  } catch (err: any) {
    console.error("Password reset request failed:", err);
    // Still return a generic success shape to avoid leaking anything via errors.
    return NextResponse.json({
      success: true,
      message: "If that number is registered, a code has been sent.",
    });
  }
}
