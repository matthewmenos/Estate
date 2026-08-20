import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";

export async function POST(req: NextRequest) {
  const { address, city } = await req.json();
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const coords = await geocodeAddress(address, city ?? "Accra");
  // Always 200, even on a miss — a listing without coordinates is a normal,
  // expected outcome (address didn't geocode cleanly), not an error.
  return NextResponse.json({ coords });
}
