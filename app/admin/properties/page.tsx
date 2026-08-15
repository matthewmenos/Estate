"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { useAdminGuard } from "@/lib/useAdminGuard";
import AdminNav from "@/components/AdminNav";

type Property = {
  id: string;
  title: string;
  status: string;
  price: number;
  currency: string;
  listing_type: string;
  city: string;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

const statusColor: Record<string, string> = {
  available: "text-green-700 bg-green-100",
  occupied: "text-gold bg-gold/10",
  sold: "text-slate bg-ink/5",
  unlisted: "text-rust bg-rust/10",
};

export default function AdminPropertiesPage() {
  const status = useAdminGuard();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "available" | "occupied" | "sold" | "unlisted">("all");

  async function load() {
    const { data, error } = await supabaseBrowser
      .from("properties")
      .select("id, title, status, price, currency, listing_type, city, created_at, profiles(full_name, phone)")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setProperties((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (status === "allowed") load();
  }, [status]);

  async function setPropertyStatus(id: string, newStatus: string) {
    setBusyId(id);
    await supabaseBrowser.from("properties").update({ status: newStatus }).eq("id", id);
    await load();
    setBusyId(null);
  }

  async function removeProperty(id: string) {
    const confirmed = window.confirm("Permanently delete this listing? This can't be undone.");
    if (!confirmed) return;
    setBusyId(id);
    await supabaseBrowser.from("properties").delete().eq("id", id);
    await load();
    setBusyId(null);
  }

  if (status === "checking") return <main className="mx-auto max-w-4xl px-4 py-8 text-sm text-slate">Loading…</main>;
  if (status === "denied")
    return <main className="mx-auto max-w-4xl px-4 py-8 text-sm text-rust">You don't have access to this page.{" "}
        <a href="/admin/claim" className="text-rust hover:underline">Have an admin password?</a>
      </main>;

  const filtered = filter === "all" ? properties : properties.filter((p) => p.status === filter);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink mb-1">Admin</h1>
      <p className="text-sm text-slate mb-4">Platform-wide overview and moderation.</p>
      <AdminNav />

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-display font-semibold text-ink">
          All properties {properties.length > 0 && <span className="text-slate font-normal text-sm">({properties.length})</span>}
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="rounded-sm border border-ink/20 bg-paper-raised px-3 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="sold">Sold</option>
          <option value="unlisted">Unlisted</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate">No properties match that filter.</p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-sm border border-ink/10">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
              <div className="min-w-0">
                <Link href={`/properties/${p.id}`} className="font-medium text-ink hover:text-rust truncate block">
                  {p.title}
                </Link>
                <p className="text-xs text-slate">
                  {p.profiles?.full_name || p.profiles?.phone || "Unknown owner"} · {p.city} · {p.currency}{" "}
                  {Number(p.price).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-1 rounded-sm capitalize ${statusColor[p.status]}`}>
                  {p.status}
                </span>
                {p.status !== "unlisted" ? (
                  <button
                    onClick={() => setPropertyStatus(p.id, "unlisted")}
                    disabled={busyId === p.id}
                    className="text-xs rounded-sm border border-ink/30 text-ink px-2 py-1.5 font-medium disabled:opacity-50"
                  >
                    Unlist
                  </button>
                ) : (
                  <button
                    onClick={() => setPropertyStatus(p.id, "available")}
                    disabled={busyId === p.id}
                    className="text-xs rounded-sm border border-ink/30 text-ink px-2 py-1.5 font-medium disabled:opacity-50"
                  >
                    Relist
                  </button>
                )}
                <button
                  onClick={() => removeProperty(p.id)}
                  disabled={busyId === p.id}
                  className="text-xs rounded-sm bg-rust text-paper-raised px-2 py-1.5 font-medium disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
