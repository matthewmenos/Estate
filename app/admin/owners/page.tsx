"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  verification_status: string;
  is_admin: boolean;
  created_at: string;
  properties: { id: string }[];
};

const statusColor: Record<string, string> = {
  verified: "text-green-700 bg-green-100",
  pending: "text-gold bg-gold/10",
  unverified: "text-slate bg-ink/5",
  rejected: "text-rust bg-rust/10",
};

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabaseBrowser
      .from("profiles")
      .select("id, full_name, phone, email, verification_status, is_admin, created_at, properties(id)")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setOwners((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleAdmin(owner: Owner) {
    setBusyId(owner.id);
    await supabaseBrowser.from("profiles").update({ is_admin: !owner.is_admin }).eq("id", owner.id);
    await load();
    setBusyId(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">
        Owners {owners.length > 0 && <span className="text-slate font-normal text-lg">({owners.length})</span>}
      </h1>
      <p className="text-sm text-slate mb-6">Every registered account. Promote or demote admin access here.</p>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-sm border border-ink/10 shadow-soft">
          {owners.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{o.full_name || "(no name)"}</p>
                <p className="text-xs text-slate font-mono truncate">{o.phone || o.email}</p>
                <p className="text-xs text-slate">{o.properties?.length ?? 0} listing(s)</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-1 rounded-sm capitalize ${statusColor[o.verification_status]}`}>
                  {o.verification_status}
                </span>
                <button
                  onClick={() => toggleAdmin(o)}
                  disabled={busyId === o.id}
                  className={`text-xs rounded-sm px-2 py-1.5 font-medium border disabled:opacity-50 ${
                    o.is_admin ? "border-ink text-ink" : "border-ink/20 text-slate"
                  }`}
                >
                  {o.is_admin ? "Admin ✓" : "Make admin"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
