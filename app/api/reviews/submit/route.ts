import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const { token, rating, comment } = await req.json();
    if (!token || !rating) {
      return NextResponse.json({ error: "token and rating are required" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
    }

    // The token itself is unguessable (a UUID), but rate-limit anyway —
    // consistent with every other unauthenticated write endpoint in this app.
    const allowed = await checkRateLimit(`review-submit:${token}`, 5, 60 * 60);
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const supabase = supabaseServer();

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, property_id, properties(owner_id)")
      .eq("review_token", token)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Invalid review link" }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "A review has already been submitted for this tenancy" }, { status: 409 });
    }

    const { error: insertError } = await supabase.from("reviews").insert({
      tenant_id: tenant.id,
      property_id: tenant.property_id,
      owner_id: (tenant as any).properties.owner_id,
      rating,
      comment: comment || null,
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Review submission failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
