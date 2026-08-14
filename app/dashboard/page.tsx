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
        .select("id, title, status, price, currency, listing_type")
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
        <h1 className="text-xl font-bold text-brand-dark">Your listings</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/inquiries"
            className="rounded-md border border-brand-dark text-brand-dark px-4 py-2 text-sm font-medium"
          >
            Inquiries
          </Link>
          <Link
            href="/dashboard/new"
            className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium"
          >
            + New listing
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : properties.length === 0 ? (
        <p className="text-gray-500 text-sm">
          You haven't listed a property yet. Click "New listing" to get started.
        </p>
      ) : (
        <div className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/edit/${p.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {p.status} · {p.listing_type}
                </p>
              </div>
              <p className="font-semibold text-brand text-sm">
                {p.currency} {Number(p.price).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
