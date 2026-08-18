"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";

type TenantRow = {
  id: string;
  name: string;
  phone: string;
  rent_amount: number;
  properties: { title: string; profiles: { full_name: string | null; phone: string | null } | null } | null;
  rent_payments: { status: string; due_date: string }[];
};

const statusColor: Record<string, string> = {
  paid: "text-ink bg-teal/15",
  pending: "text-gold bg-gold/10",
  overdue: "text-rust bg-rust/10",
  failed: "text-rust bg-rust/10",
  "no payments logged": "text-slate bg-ink/5",
};

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabaseBrowser
        .from("tenants")
        .select(
          "id, name, phone, rent_amount, properties(title, profiles(full_name, phone)), rent_payments(status, due_date)"
        )
        .order("created_at", { ascending: false });
      if (error) console.error(error);
      setTenants((data as any) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function latestStatus(t: TenantRow) {
    if (!t.rent_payments || t.rent_payments.length === 0) return "no payments logged";
    const sorted = [...t.rent_payments].sort((a, b) => (a.due_date < b.due_date ? 1 : -1));
    return sorted[0].status;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">
        Tenants {tenants.length > 0 && <span className="text-slate font-normal text-lg">({tenants.length})</span>}
      </h1>
      <p className="text-sm text-slate mb-6">Every tenant across every owner's properties.</p>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : tenants.length === 0 ? (
        <p className="text-sm text-slate">No tenants on the platform yet.</p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-xl border border-ink/10 shadow-soft">
          {tenants.map((t) => {
            const status = latestStatus(t);
            return (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{t.name}</p>
                  <p className="text-xs text-slate truncate">
                    {t.properties?.title} · owner: {t.properties?.profiles?.full_name || t.properties?.profiles?.phone || "unknown"}
                  </p>
                  <p className="text-xs text-slate font-mono">GHS {Number(t.rent_amount).toLocaleString()}/mo</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-xl capitalize shrink-0 ${statusColor[status]}`}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
