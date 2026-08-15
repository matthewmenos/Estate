import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { verifyPhoneOtp, normalizeGhanaPhone } from "@/lib/arkesel";

export async function POST(req: NextRequest) {
  try {
    const { phone, code, newPassword } = await req.json();
    if (!phone || !code || !newPassword) {
      return NextResponse.json(
        { error: "phone, code, and newPassword are required" },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalized = normalizeGhanaPhone(phone);

    // The Arkesel code is the only proof of identity we have here — this is
    // what stands in for "you control this phone number, so you're allowed
    // to reset the password on the account it's attached to."
    const { verified } = await verifyPhoneOtp(normalized, code);
    if (!verified) {
      return NextResponse.json({ error: "Incorrect or expired code" }, { status: 400 });
    }

    const supabase = supabaseServer();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", normalized)
      .eq("phone_verified", true)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "No account found for that number" }, { status: 404 });
    }

    // Service-role admin call — only reachable server-side, never exposed to the client.
    const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Password reset confirm failed:", err);
    return NextResponse.json({ error: err.message ?? "Failed to reset password" }, { status: 500 });
  }
}
