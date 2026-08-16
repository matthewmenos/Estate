"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";

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
    load();
  }, []);

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

  const filtered = filter === "all" ? properties : properties.filter((p) => p.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-ink">
          Properties {properties.length > 0 && <span className="text-slate font-normal text-lg">({properties.length})</span>}
        </h1>
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
      <p className="text-sm text-slate mb-6">Every listing on the platform, regardless of owner.</p>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate">No properties match that filter.</p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-sm border border-ink/10 shadow-soft">
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
                <Link
                  href={`/dashboard/edit/${p.id}`}
                  className="text-xs rounded-sm border border-ink/30 text-ink px-2 py-1.5 font-medium"
                >
                  Edit
                </Link>
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
    </div>
  );
}
