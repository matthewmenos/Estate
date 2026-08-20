import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase";
import { sendNotificationSms } from "@/lib/arkeselSms";

export async function POST(req: NextRequest) {
  const { propertyId, renterName, renterPhone, message } = await req.json();

  if (!propertyId || !renterName || !renterPhone) {
    return NextResponse.json(
      { error: "propertyId, renterName, and renterPhone are required" },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  // Inquiries can be submitted anonymously (no login required) — but if the
  // request carries an auth token (a logged-in renter), link the inquiry to
  // their account so it shows up in their "My inquiries" history.
  let renterId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const authedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await authedClient.auth.getUser();
    renterId = userData.user?.id ?? null;
  }

  const { error } = await supabase.from("inquiries").insert({
    property_id: propertyId,
    renter_name: renterName,
    renter_phone: renterPhone,
    message: message ?? null,
    renter_id: renterId,
  });

  if (error) {
    console.error("Inquiry insert failed:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }

  // Notify the owner right away — previously this just sat silently in
  // their dashboard until they happened to check. Best-effort: a failed
  // notification should never fail the inquiry submission itself.
  const { data: property } = await supabase
    .from("properties")
    .select("title, profiles(phone)")
    .eq("id", propertyId)
    .single();

  const ownerPhone = (property as any)?.profiles?.phone;
  if (ownerPhone) {
    await sendNotificationSms(
      ownerPhone,
      `New inquiry on "${property!.title}" from ${renterName} (${renterPhone}). Check your Accra Rentals dashboard.`
    );
  }

  return NextResponse.json({ success: true });
}
