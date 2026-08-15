import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase";
import { initiateMobileMoneyCharge, guessChannel } from "@/lib/hubtel";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the caller's identity using their access token, so we never
    // trust a client-supplied ownerId.
    const authedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await authedClient.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { rentPaymentId } = await req.json();
    if (!rentPaymentId) {
      return NextResponse.json({ error: "rentPaymentId is required" }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Fetch the payment + tenant + property, and confirm the caller owns it.
    const { data: payment, error } = await supabase
      .from("rent_payments")
      .select("id, amount, tenant_id, tenants(name, phone, property_id, properties(owner_id, title))")
      .eq("id", rentPaymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const tenant = (payment as any).tenants;
    if (tenant.properties.owner_id !== userData.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const clientReference = `rentpay-${payment.id}-${randomUUID().slice(0, 8)}`;

    const result = await initiateMobileMoneyCharge({
      customerName: tenant.name,
      customerPhone: tenant.phone,
      channel: guessChannel(tenant.phone),
      amount: Number(payment.amount),
      clientReference,
      description: `Rent — ${tenant.properties.title}`,
    });

    // Record the attempt so the callback can find it by reference.
    await supabase
      .from("rent_payments")
      .update({
        payment_method: "mobile_money",
        hubtel_client_reference: clientReference,
        hubtel_transaction_id: result.Data?.TransactionId ?? null,
      })
      .eq("id", payment.id);

    return NextResponse.json({ success: true, status: result.Status });
  } catch (err: any) {
    console.error("Payment initiation failed:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
