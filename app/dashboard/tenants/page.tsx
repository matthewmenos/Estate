"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { downloadCsv } from "@/lib/csv";

type TenantRow = {
  id: string;
  name: string;
  phone: string;
  rent_amount: number;
  rent_due_day: number;
  properties: { title: string } | null;
  rent_payments: { status: string; due_date: string; amount: number; paid_date: string | null; payment_method: string }[];
};

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabaseBrowser
        .from("tenants")
        .select(
          "id, name, phone, rent_amount, rent_due_day, properties(title), rent_payments(status, due_date, amount, paid_date, payment_method)"
        )
        .order("created_at", { ascending: false });

      if (error) console.error("Failed to load tenants:", error);
      setTenants((data as any) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  function latestStatus(t: TenantRow) {
    if (!t.rent_payments || t.rent_payments.length === 0) return "no payments logged";
    const sorted = [...t.rent_payments].sort((a, b) => (a.due_date < b.due_date ? 1 : -1));
    return sorted[0].status;
  }

  const statusColor: Record<string, string> = {
    paid: "text-ink bg-teal/15",
    pending: "text-gold bg-gold/10",
    overdue: "text-rust bg-rust/10",
    failed: "text-rust bg-rust/10",
    "no payments logged": "text-slate bg-ink/5",
  };

  function exportAll() {
    const rows: (string | number)[][] = [];
    tenants.forEach((t) => {
      t.rent_payments.forEach((p) => {
        rows.push([t.name, t.properties?.title ?? "", p.due_date, p.amount, p.status, p.paid_date ?? "", p.payment_method]);
      });
    });
    downloadCsv(
      "all-tenants-rent-history.csv",
      ["Tenant", "Property", "Due date", "Amount (GHS)", "Status", "Paid date", "Method"],
      rows
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Tenants & rent</h1>
        <div className="flex gap-2">
          <button
            onClick={exportAll}
            className="rounded-full border border-ink/30 text-ink px-4 py-2 text-sm font-medium"
          >
            Export CSV
          </button>
          <Link
            href="/dashboard/tenants/new"
            className="rounded-xl bg-rust text-paper-raised px-4 py-2 text-sm font-medium"
          >
            + Add tenant
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : tenants.length === 0 ? (
        <p className="text-sm text-slate">
          No tenants yet. Add one to start tracking rent for an occupied property.
        </p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-xl border border-ink/10">
          {tenants.map((t) => {
            const status = latestStatus(t);
            return (
              <Link
                key={t.id}
                href={`/dashboard/tenants/${t.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-paper"
              >
                <div>
                  <p className="font-medium text-ink">{t.name}</p>
                  <p className="text-xs text-slate">
                    {t.properties?.title} · GHS {Number(t.rent_amount).toLocaleString()}/mo · due day{" "}
                    {t.rent_due_day}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-xl capitalize ${statusColor[status]}`}
                >
                  {status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
