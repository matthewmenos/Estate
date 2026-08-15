"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { useAdminGuard } from "@/lib/useAdminGuard";
import AdminNav from "@/components/AdminNav";

type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  verification_status: string;
  created_at: string;
};

export default function AdminVerifyPage() {
  const status = useAdminGuard();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabaseBrowser
      .from("profiles")
      .select("id, full_name, phone, verification_status, created_at")
      .neq("verification_status", "verified")
      .order("created_at", { ascending: true });
    setOwners(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (status === "allowed") load();
  }, [status]);

  async function setStatus(id: string, newStatus: "verified" | "rejected") {
    await supabaseBrowser.from("profiles").update({ verification_status: newStatus }).eq("id", id);
    setOwners((prev) => prev.filter((o) => o.id !== id));
  }

  if (status === "checking") return <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate">Loading…</main>;
  if (status === "denied")
    return <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-rust">You don't have access to this page.</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold text-ink mb-1">Admin</h1>
      <p className="text-sm text-slate mb-4">Platform-wide overview and moderation.</p>
      <AdminNav />

      <h2 className="font-display font-semibold text-ink mb-1">Owner verification queue</h2>
      <p className="text-sm text-slate mb-6">
        Approve owners after confirming identity/ownership (phone call, ID check, etc. — outside this app for now).
      </p>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : owners.length === 0 ? (
        <p className="text-sm text-slate">Nothing pending.</p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-sm border border-ink/10">
          {owners.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-ink">{o.full_name || "(no name on file)"}</p>
                <p className="text-sm text-slate font-mono">{o.phone}</p>
                <p className="text-xs text-slate/70 capitalize">{o.verification_status}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus(o.id, "verified")}
                  className="rounded-sm bg-gold text-ink px-3 py-1.5 text-sm font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => setStatus(o.id, "rejected")}
                  className="rounded-sm border border-rust text-rust px-3 py-1.5 text-sm font-medium"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
