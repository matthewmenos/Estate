import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { sendNotificationSms } from "@/lib/arkeselSms";

/**
 * Hubtel POSTs the outcome of a Receive Money request here. The exact
 * payload shape can vary slightly by integration type — this reads the
 * common fields (ClientReference + a success/failure indicator) and is
 * intentionally tolerant of naming differences until you've confirmed the
 * exact shape against a real callback in your Hubtel dashboard logs.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const clientReference =
      body.ClientReference || body.Data?.ClientReference || body.data?.clientReference;
    const success =
      body.Status === "Success" ||
      body.ResponseCode === "0000" ||
      body.Data?.Status === "Success";

    if (!clientReference) {
      console.warn("Hubtel callback missing ClientReference:", body);
      return NextResponse.json({ received: true });
    }

    const supabase = supabaseServer();

    const { data: payment } = await supabase
      .from("rent_payments")
      .update({
        status: success ? "paid" : "failed",
        paid_date: success ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq("hubtel_client_reference", clientReference)
      .select("amount, tenants(name, properties(title, profiles(phone)))")
      .single();

    // Best-effort owner notification — a failed text should never affect
    // whether the payment status itself was recorded correctly above.
    const tenant = (payment as any)?.tenants;
    const ownerPhone = tenant?.properties?.profiles?.phone;
    if (ownerPhone) {
      const amount = Number(payment!.amount).toLocaleString();
      const text = success
        ? `Rent payment received: GHS ${amount} from ${tenant.name} for "${tenant.properties.title}".`
        : `Rent payment attempt failed: GHS ${amount} from ${tenant.name} for "${tenant.properties.title}". They may need to retry.`;
      await sendNotificationSms(ownerPhone, text);
    }

    // Hubtel expects a 200 response to acknowledge receipt.
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Hubtel callback processing failed:", err);
    // Still acknowledge with 200 where possible — a 500 here can trigger
    // repeated retries from Hubtel for a payload we may never be able to parse.
    return NextResponse.json({ received: true });
  }
}
