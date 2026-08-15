import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase";
import { verifyPhoneOtp, normalizeGhanaPhone } from "@/lib/arkesel";
import { isConfiguredAdmin } from "@/lib/adminConfig";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const authedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await authedClient.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "phone and code are required" }, { status: 400 });
    }

    const { verified, raw } = await verifyPhoneOtp(phone, code);
    if (!verified) {
      return NextResponse.json({ error: "Incorrect or expired code", detail: raw }, { status: 400 });
    }

    // Use the service-role client so this write isn't gated by the profile's own RLS timing.
    const supabase = supabaseServer();

    // Auto-promote to admin if this phone or the account's email is in the
    // ADMIN_PHONES / ADMIN_EMAILS env allowlist — checked fresh on every
    // verification, so adding/removing an entry and having them re-verify
    // (or an admin re-running this) keeps admin status in sync with the env.
    const shouldBeAdmin = isConfiguredAdmin({
      phone: normalizeGhanaPhone(phone),
      email: userData.user.email,
    });

    const { error } = await supabase
      .from("profiles")
      .update({
        phone: normalizeGhanaPhone(phone),
        phone_verified: true,
        ...(shouldBeAdmin ? { is_admin: true } : {}),
      })
      .eq("id", userData.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, isAdmin: shouldBeAdmin });
  } catch (err: any) {
    console.error("OTP verify failed:", err);
    return NextResponse.json({ error: err.message ?? "Verification failed" }, { status: 500 });
  }
}
