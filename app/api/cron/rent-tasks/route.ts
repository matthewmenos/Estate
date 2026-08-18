import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { sendNotificationSms } from "@/lib/arkeselSms";

const DAYS_AHEAD_TO_GENERATE = 5; // create next due payment this many days before it's due

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nextDueDateFor(rentDueDay: number, fromDateStr: string) {
  const from = new Date(fromDateStr);
  const year = from.getMonth() === 11 ? from.getFullYear() + 1 : from.getFullYear();
  const month = from.getMonth() === 11 ? 0 : from.getMonth() + 1;
  const clampedDay = Math.min(rentDueDay, 28); // rent_due_day is already constrained 1-28 in the schema
  return new Date(year, month, clampedDay).toISOString().slice(0, 10);
}

/**
 * Vercel Cron (see vercel.json) triggers this daily and automatically sends
 * `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set as an env
 * var — this check rejects anyone else from hitting the endpoint directly.
 * You can also trigger it manually for testing:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/cron/rent-tasks
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseServer();
  const today = todayISO();
  const results = { generated: 0, markedOverdue: 0, remindersSent: 0, errors: [] as string[] };

  // 1. Mark pending payments past their due date as overdue, and remind the tenant.
  const { data: overdue, error: overdueErr } = await supabase
    .from("rent_payments")
    .select("id, amount, due_date, tenants(name, phone, properties(title))")
    .eq("status", "pending")
    .lt("due_date", today);

  if (overdueErr) {
    results.errors.push(`overdue query: ${overdueErr.message}`);
  } else {
    for (const payment of overdue ?? []) {
      await supabase.from("rent_payments").update({ status: "overdue" }).eq("id", payment.id);
      results.markedOverdue++;

      const tenant = (payment as any).tenants;
      if (tenant?.phone) {
        await sendNotificationSms(
          tenant.phone,
          `Reminder: your rent of GHS ${Number(payment.amount).toLocaleString()} for "${tenant.properties.title}" was due ${payment.due_date} and hasn't been received yet.`
        );
        results.remindersSent++;
      }
    }
  }

  // 2. For each tenant, generate their next due payment if it's coming up
  // soon and doesn't already exist.
  const { data: tenants, error: tenantsErr } = await supabase
    .from("tenants")
    .select("id, rent_amount, rent_due_day");

  if (tenantsErr) {
    results.errors.push(`tenants query: ${tenantsErr.message}`);
  } else {
    for (const tenant of tenants ?? []) {
      const { data: latest } = await supabase
        .from("rent_payments")
        .select("due_date")
        .eq("tenant_id", tenant.id)
        .order("due_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextDue = nextDueDateFor(tenant.rent_due_day, latest?.due_date ?? today);

      // Only create it once we're within the generation window, and only if
      // a payment for that exact due date doesn't already exist.
      if (nextDue <= addDays(today, DAYS_AHEAD_TO_GENERATE)) {
        const { data: existing } = await supabase
          .from("rent_payments")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("due_date", nextDue)
          .maybeSingle();

        if (!existing) {
          const { error: insertErr } = await supabase.from("rent_payments").insert({
            tenant_id: tenant.id,
            amount: tenant.rent_amount,
            due_date: nextDue,
            status: "pending",
          });
          if (insertErr) {
            results.errors.push(`insert for tenant ${tenant.id}: ${insertErr.message}`);
          } else {
            results.generated++;
          }
        }
      }
    }
  }

  return NextResponse.json(results);
}
