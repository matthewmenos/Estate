"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

type Tenant = {
  id: string;
  name: string;
  phone: string;
  rent_amount: number;
  rent_due_day: number;
  lease_start: string | null;
  lease_end: string | null;
  properties: { title: string } | null;
};

type Payment = {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string;
};

const statusColor: Record<string, string> = {
  paid: "text-ink bg-teal/15",
  pending: "text-gold bg-gold/10",
  overdue: "text-rust bg-rust/10",
  failed: "text-rust bg-rust/10",
};

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDueDate, setNewDueDate] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data: userData } = await supabaseBrowser.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data: t } = await supabaseBrowser
      .from("tenants")
      .select("id, name, phone, rent_amount, rent_due_day, lease_start, lease_end, properties(title)")
      .eq("id", params.id)
      .single();
    setTenant(t as any);

    const { data: p } = await supabaseBrowser
      .from("rent_payments")
      .select("id, amount, due_date, paid_date, status, payment_method")
      .eq("tenant_id", params.id)
      .order("due_date", { ascending: false });
    setPayments(p ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function addDuePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant || !newDueDate) return;

    await supabaseBrowser.from("rent_payments").insert({
      tenant_id: tenant.id,
      amount: tenant.rent_amount,
      due_date: newDueDate,
      status: "pending",
    });
    setNewDueDate("");
    load();
  }

  async function markPaidManually(paymentId: string) {
    setBusyId(paymentId);
    await supabaseBrowser
      .from("rent_payments")
      .update({
        status: "paid",
        payment_method: "manual",
        paid_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", paymentId);
    setBusyId(null);
    load();
  }

  async function requestMobileMoney(paymentId: string) {
    setBusyId(paymentId);
    setError(null);

    const { data: sessionData } = await supabaseBrowser.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/payments/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rentPaymentId: paymentId }),
    });

    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to send payment request.");
      return;
    }
    load();
  }

  if (loading) return <main className="mx-auto max-w-2xl px-4 py-8 text-sm text-slate">Loading…</main>;
  if (!tenant) return <main className="mx-auto max-w-2xl px-4 py-8 text-sm text-rust">Tenant not found.</main>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">{tenant.name}</h1>
      <p className="text-sm text-slate mb-1">{tenant.properties?.title}</p>
      <p className="text-sm text-slate font-mono mb-6">{tenant.phone}</p>

      <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
        <div className="bg-paper-raised border border-ink/10 rounded-xl p-3">
          <p className="text-slate text-xs">Monthly rent</p>
          <p className="font-mono font-semibold text-ink">GHS {Number(tenant.rent_amount).toLocaleString()}</p>
        </div>
        <div className="bg-paper-raised border border-ink/10 rounded-xl p-3">
          <p className="text-slate text-xs">Due day</p>
          <p className="font-mono font-semibold text-ink">{tenant.rent_due_day}</p>
        </div>
        <div className="bg-paper-raised border border-ink/10 rounded-xl p-3">
          <p className="text-slate text-xs">Lease</p>
          <p className="text-ink text-xs">
            {tenant.lease_start ?? "—"} → {tenant.lease_end ?? "—"}
          </p>
        </div>
      </div>

      <form onSubmit={addDuePayment} className="flex items-end gap-3 mb-8">
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink mb-1">Add a due payment</label>
          <input
            type="date"
            required
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-ink text-ink px-4 py-2 text-sm font-medium"
        >
          Add
        </button>
      </form>

      {error && <p className="text-sm text-rust mb-4">{error}</p>}

      <h2 className="font-display font-semibold text-ink mb-3">Payment history</h2>
      {payments.length === 0 ? (
        <p className="text-sm text-slate">No payments logged yet.</p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-xl border border-ink/10">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-mono text-sm text-ink">
                  GHS {Number(p.amount).toLocaleString()} — due {p.due_date}
                </p>
                {p.paid_date && (
                  <p className="text-xs text-slate">
                    Paid {p.paid_date} · {p.payment_method === "mobile_money" ? "Mobile money" : "Logged manually"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-xl capitalize ${statusColor[p.status]}`}>
                  {p.status}
                </span>
                {p.status !== "paid" && (
                  <>
                    <button
                      onClick={() => requestMobileMoney(p.id)}
                      disabled={busyId === p.id}
                      className="text-xs rounded-xl bg-rust text-paper-raised px-2 py-1.5 font-medium disabled:opacity-50"
                    >
                      {busyId === p.id ? "Sending…" : "Request MoMo"}
                    </button>
                    <button
                      onClick={() => markPaidManually(p.id)}
                      disabled={busyId === p.id}
                      className="text-xs rounded-xl border border-ink/30 text-ink px-2 py-1.5 font-medium disabled:opacity-50"
                    >
                      Mark paid
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
