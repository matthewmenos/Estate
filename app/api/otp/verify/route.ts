import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase";
import { verifyPhoneOtp, normalizeGhanaPhone } from "@/lib/arkesel";

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
    const { error } = await supabase
      .from("profiles")
      .update({ phone: normalizeGhanaPhone(phone), phone_verified: true })
      .eq("id", userData.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("OTP verify failed:", err);
    return NextResponse.json({ error: err.message ?? "Verification failed" }, { status: 500 });
  }
}
