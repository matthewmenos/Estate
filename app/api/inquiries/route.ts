import { NextRequest, NextResponse } from "next/server";
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

  const { error } = await supabase.from("inquiries").insert({
    property_id: propertyId,
    renter_name: renterName,
    renter_phone: renterPhone,
    message: message ?? null,
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
