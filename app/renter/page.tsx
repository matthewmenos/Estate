"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

type SavedListing = {
  id: string;
  saved_price: number;
  properties: { id: string; title: string; price: number; currency: string; status: string } | null;
};

type Inquiry = {
  id: string;
  message: string | null;
  created_at: string;
  properties: { id: string; title: string } | null;
};

type Alert = {
  id: string;
  listing_type: string | null;
  min_bedrooms: number | null;
  max_price: number | null;
  city: string;
};

export default function RenterDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"saved" | "inquiries" | "alerts">("saved");
  const [saved, setSaved] = useState<SavedListing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data: userData } = await supabaseBrowser.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    const [savedRes, inquiriesRes, alertsRes] = await Promise.all([
      supabaseBrowser
        .from("saved_listings")
        .select("id, saved_price, properties(id, title, price, currency, status)")
        .order("created_at", { ascending: false }),
      supabaseBrowser
        .from("inquiries")
        .select("id, message, created_at, properties(id, title)")
        .order("created_at", { ascending: false }),
      supabaseBrowser
        .from("search_alerts")
        .select("id, listing_type, min_bedrooms, max_price, city")
        .order("created_at", { ascending: false }),
    ]);

    setSaved((savedRes.data as any) ?? []);
    setInquiries((inquiriesRes.data as any) ?? []);
    setAlerts((alertsRes.data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function removeSaved(id: string) {
    await supabaseBrowser.from("saved_listings").delete().eq("id", id);
    setSaved((s) => s.filter((x) => x.id !== id));
  }

  async function removeAlert(id: string) {
    await supabaseBrowser.from("search_alerts").delete().eq("id", id);
    setAlerts((a) => a.filter((x) => x.id !== id));
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink mb-1">My account</h1>
      <p className="text-sm text-slate mb-6">Saved listings, your inquiries, and search alerts.</p>

      <div className="flex gap-2 mb-6 border-b border-ink/10">
        {(["saved", "inquiries", "alerts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? "border-rust text-rust" : "border-transparent text-slate hover:text-ink"
            }`}
          >
            {t === "saved" ? "Saved listings" : t === "inquiries" ? "My inquiries" : "Search alerts"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : tab === "saved" ? (
        saved.length === 0 ? (
          <p className="text-sm text-slate">
            No saved listings yet. Tap the heart icon on any listing to save it here.
          </p>
        ) : (
          <div className="divide-y divide-ink/10 bg-paper-raised rounded-xl border border-ink/10 shadow-soft">
            {saved.map((s) => {
              const p = s.properties;
              if (!p) return null;
              const priceChanged = Number(p.price) !== Number(s.saved_price);
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <Link href={`/properties/${p.id}`} className="font-medium text-ink hover:text-rust truncate block">
                      {p.title}
                    </Link>
                    <p className="text-sm font-mono text-slate">
                      {p.currency} {Number(p.price).toLocaleString()}
                      {priceChanged && (
                        <span className="ml-2 text-xs text-rust font-sans">
                          (was {p.currency} {Number(s.saved_price).toLocaleString()})
                        </span>
                      )}
                    </p>
                    {p.status !== "available" && (
                      <p className="text-xs text-slate capitalize">{p.status}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeSaved(s.id)}
                    className="text-xs rounded-full border border-ink/20 text-slate px-3 py-1.5 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : tab === "inquiries" ? (
        inquiries.length === 0 ? (
          <p className="text-sm text-slate">
            No inquiries yet — inquiries you submit while logged in will show up here.
          </p>
        ) : (
          <div className="divide-y divide-ink/10 bg-paper-raised rounded-xl border border-ink/10 shadow-soft">
            {inquiries.map((inq) => (
              <div key={inq.id} className="px-4 py-3">
                <Link
                  href={`/properties/${inq.properties?.id}`}
                  className="font-medium text-ink hover:text-rust"
                >
                  {inq.properties?.title ?? "Listing"}
                </Link>
                <p className="text-xs text-slate/70">{new Date(inq.created_at).toLocaleDateString()}</p>
                {inq.message && <p className="text-sm text-ink/80 mt-1 italic">"{inq.message}"</p>}
              </div>
            ))}
          </div>
        )
      ) : alerts.length === 0 ? (
        <p className="text-sm text-slate">
          No search alerts yet — set filters on the homepage and tap "Alert me" to save a search.
        </p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-xl border border-ink/10 shadow-soft">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm text-ink">
                {a.listing_type ? (a.listing_type === "rent" ? "For rent" : "For sale") : "Any type"} in {a.city}
                {a.min_bedrooms ? ` · ${a.min_bedrooms}+ bed` : ""}
                {a.max_price ? ` · up to GHS ${Number(a.max_price).toLocaleString()}` : ""}
              </p>
              <button
                onClick={() => removeAlert(a.id)}
                className="text-xs rounded-full border border-ink/20 text-slate px-3 py-1.5 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
