"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

type Property = {
  id: string;
  title: string;
  status: string;
  price: number;
  currency: string;
  listing_type: string;
  view_count: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data } = await supabaseBrowser
        .from("properties")
        .select("id, title, status, price, currency, listing_type, view_count")
        .eq("owner_id", userData.user.id)
        .order("created_at", { ascending: false });

      setProperties(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ink">Your listings</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/inquiries"
            className="rounded-sm border border-ink text-ink px-4 py-2 text-sm font-medium"
          >
            Inquiries
          </Link>
          <Link
            href="/dashboard/new"
            className="rounded-sm bg-rust text-paper-raised px-4 py-2 text-sm font-medium"
          >
            + New listing
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-slate text-sm">Loading…</p>
      ) : properties.length === 0 ? (
        <p className="text-slate text-sm">
          You haven't listed a property yet. Click "New listing" to get started.
        </p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-sm border border-ink/10">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/edit/${p.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-paper"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-slate capitalize">
                  {p.status} · {p.listing_type} · {p.view_count} view{p.view_count === 1 ? "" : "s"}
                </p>
              </div>
              <p className="font-semibold text-rust text-sm">
                {p.currency} {Number(p.price).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
