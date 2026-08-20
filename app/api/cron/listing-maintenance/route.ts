import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { sendNotificationSms } from "@/lib/arkeselSms";

const STALE_DAYS = 90;

/**
 * Vercel Cron triggers this daily (see vercel.json) — same auth pattern as
 * /api/cron/rent-tasks. Manual test:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/cron/listing-maintenance
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseServer();
  const results = { alertsMatched: 0, listingsExpired: 0, errors: [] as string[] };

  // 1. Match newly-available, not-yet-processed listings against saved search alerts.
  const { data: newListings, error: listingsErr } = await supabase
    .from("properties")
    .select("id, title, city, listing_type, bedrooms, price, currency")
    .eq("status", "available")
    .eq("alert_sent", false);

  if (listingsErr) {
    results.errors.push(`listings query: ${listingsErr.message}`);
  } else {
    for (const property of newListings ?? []) {
      const { data: alerts, error: alertsErr } = await supabase
        .from("search_alerts")
        .select("id, renter_id, listing_type, min_bedrooms, max_price, city, profiles(phone)")
        .eq("city", property.city);

      if (alertsErr) {
        results.errors.push(`alerts query for ${property.id}: ${alertsErr.message}`);
      } else {
        for (const alert of alerts ?? []) {
          const typeMatches = !alert.listing_type || alert.listing_type === property.listing_type;
          const bedsMatch = !alert.min_bedrooms || (property.bedrooms ?? 0) >= alert.min_bedrooms;
          const priceMatches = !alert.max_price || Number(property.price) <= alert.max_price;

          if (typeMatches && bedsMatch && priceMatches) {
            const phone = (alert as any).profiles?.phone;
            if (phone) {
              await sendNotificationSms(
                phone,
                `New match for your saved search: "${property.title}" — ${property.currency} ${Number(property.price).toLocaleString()} in ${property.city}. Check Accra Rentals.`
              );
              results.alertsMatched++;
            }
          }
        }
      }

      await supabase.from("properties").update({ alert_sent: true }).eq("id", property.id);
    }
  }

  // 2. Auto-unlist listings that have sat available for too long without an update.
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS);

  const { data: staleListings, error: staleErr } = await supabase
    .from("properties")
    .select("id, title, profiles(phone)")
    .eq("status", "available")
    .lt("updated_at", staleThreshold.toISOString());

  if (staleErr) {
    results.errors.push(`stale query: ${staleErr.message}`);
  } else {
    for (const listing of staleListings ?? []) {
      await supabase.from("properties").update({ status: "unlisted" }).eq("id", listing.id);
      results.listingsExpired++;

      const phone = (listing as any).profiles?.phone;
      if (phone) {
        await sendNotificationSms(
          phone,
          `Your listing "${listing.title}" was auto-unlisted after ${STALE_DAYS} days with no updates. Edit it on Accra Rentals to relist.`
        );
      }
    }
  }

  return NextResponse.json(results);
}
