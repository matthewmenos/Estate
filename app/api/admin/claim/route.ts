import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase";
import { checkAdminPassword } from "@/lib/adminConfig";
import { checkRateLimit } from "@/lib/rateLimit";

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

    const userId = userData.user.id;
    const allowed = await checkRateLimit(`admin-claim:${userId}`, 5, 15 * 60); // 5 attempts / 15 min
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "password is required" }, { status: 400 });
    }

    if (!checkAdminPassword(password)) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
    }

    const supabase = supabaseServer();
    const { error } = await supabase.from("profiles").update({ is_admin: true }).eq("id", userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin claim failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
