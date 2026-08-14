import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

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

  return NextResponse.json({ success: true });
}
