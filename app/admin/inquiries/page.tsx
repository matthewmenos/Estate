"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";

type Inquiry = {
  id: string;
  renter_name: string;
  renter_phone: string;
  message: string | null;
  created_at: string;
  property_id: string;
  properties: { title: string } | null;
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabaseBrowser
        .from("inquiries")
        .select("id, renter_name, renter_phone, message, created_at, property_id, properties(title)")
        .order("created_at", { ascending: false });
      if (error) console.error(error);
      setInquiries((data as any) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">
        Inquiries {inquiries.length > 0 && <span className="text-slate font-normal text-lg">({inquiries.length})</span>}
      </h1>
      <p className="text-sm text-slate mb-6">Every inquiry submitted across every listing on the platform.</p>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : inquiries.length === 0 ? (
        <p className="text-sm text-slate">No inquiries yet.</p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-sm border border-ink/10 shadow-soft">
          {inquiries.map((inq) => (
            <div key={inq.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{inq.renter_name}</p>
                <p className="text-xs text-slate/70">{new Date(inq.created_at).toLocaleDateString()}</p>
              </div>
              <Link href={`/properties/${inq.property_id}`} className="text-sm text-rust hover:underline">
                {inq.properties?.title ?? "Listing"}
              </Link>
              <p className="text-sm text-slate font-mono mt-1">{inq.renter_phone}</p>
              {inq.message && <p className="text-sm text-ink/80 mt-1 italic">"{inq.message}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
