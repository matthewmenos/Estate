"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";

type Stats = {
  totalOwners: number;
  pendingVerifications: number;
  totalProperties: number;
  availableProperties: number;
  totalInquiries: number;
  totalTenants: number;
  rentCollected: number;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [owners, pending, properties, available, inquiries, tenants, paidPayments] =
        await Promise.all([
          supabaseBrowser.from("profiles").select("id", { count: "exact", head: true }),
          supabaseBrowser
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .neq("verification_status", "verified"),
          supabaseBrowser.from("properties").select("id", { count: "exact", head: true }),
          supabaseBrowser
            .from("properties")
            .select("id", { count: "exact", head: true })
            .eq("status", "available"),
          supabaseBrowser.from("inquiries").select("id", { count: "exact", head: true }),
          supabaseBrowser.from("tenants").select("id", { count: "exact", head: true }),
          supabaseBrowser.from("rent_payments").select("amount").eq("status", "paid"),
        ]);

      setStats({
        totalOwners: owners.count ?? 0,
        pendingVerifications: pending.count ?? 0,
        totalProperties: properties.count ?? 0,
        availableProperties: available.count ?? 0,
        totalInquiries: inquiries.count ?? 0,
        totalTenants: tenants.count ?? 0,
        rentCollected: (paidPayments.data ?? []).reduce((sum, p: any) => sum + Number(p.amount), 0),
      });
    }
    load();
  }, []);

  const cards = stats
    ? [
        { label: "Owners", value: stats.totalOwners, href: "/admin/owners" },
        { label: "Pending verification", value: stats.pendingVerifications, href: "/admin/verify", flag: stats.pendingVerifications > 0 },
        { label: "Properties (available)", value: `${stats.availableProperties} / ${stats.totalProperties}`, href: "/admin/properties" },
        { label: "Tenants", value: stats.totalTenants, href: "/admin/tenants" },
        { label: "Inquiries", value: stats.totalInquiries, href: "/admin/inquiries" },
        { label: "Rent collected (paid)", value: `GHS ${stats.rentCollected.toLocaleString()}`, href: null },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">Overview</h1>
      <p className="text-sm text-slate mb-6">Platform-wide stats and moderation.</p>

      {!stats ? (
        <p className="text-sm text-slate">Loading stats…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {cards.map((c) => {
            const inner = (
              <div
                className={`border rounded-xl p-4 h-full shadow-soft ${
                  c.flag ? "border-rust/40 bg-rust/5" : "border-ink/10 bg-paper-raised"
                }`}
              >
                <p className="text-xs text-slate mb-1">{c.label}</p>
                <p className="font-mono text-xl font-semibold text-ink">{c.value}</p>
              </div>
            );
            return c.href ? (
              <Link key={c.label} href={c.href} className="hover:opacity-80 transition-opacity">
                {inner}
              </Link>
            ) : (
              <div key={c.label}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
