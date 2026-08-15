import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase";
import { isConfiguredAdmin } from "@/lib/adminConfig";

/**
 * Lets an already-verified user re-check themselves against ADMIN_PHONES /
 * ADMIN_EMAILS without going through phone re-verification. Useful after
 * you add someone to the env allowlist post-signup. Only ever promotes the
 * caller themselves — never touches another user's row.
 */
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

    const supabase = supabaseServer();
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", userData.user.id)
      .single();

    const shouldBeAdmin = isConfiguredAdmin({
      phone: profile?.phone,
      email: userData.user.email,
    });

    if (shouldBeAdmin) {
      await supabase.from("profiles").update({ is_admin: true }).eq("id", userData.user.id);
    }

    return NextResponse.json({ isAdmin: shouldBeAdmin });
  } catch (err: any) {
    console.error("Admin sync failed:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
