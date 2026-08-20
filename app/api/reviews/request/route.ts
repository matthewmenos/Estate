import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase";
import { sendNotificationSms } from "@/lib/arkeselSms";

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

    const { tenantId } = await req.json();
    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Confirm the caller actually owns this tenant's property before doing
    // anything — RLS would also block the eventual update, but checking
    // explicitly here lets us return a clear 403 instead of a silent no-op.
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, name, phone, review_token, properties(title, owner_id)")
      .eq("id", tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    if ((tenant as any).properties.owner_id !== userData.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const reviewUrl = `${process.env.APP_BASE_URL}/review/${tenant.review_token}`;
    await sendNotificationSms(
      tenant.phone,
      `Hi ${tenant.name}, please share a quick review of your time renting "${(tenant as any).properties.title}": ${reviewUrl}`
    );

    await supabase.from("tenants").update({ review_requested: true }).eq("id", tenantId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Review request failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
