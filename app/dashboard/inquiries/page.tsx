"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function InquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      // RLS already restricts this to inquiries on properties the caller owns.
      const { data, error } = await supabaseBrowser
        .from("inquiries")
        .select("id, renter_name, renter_phone, message, created_at, property_id, properties(title)")
        .order("created_at", { ascending: false });

      if (error) console.error("Failed to load inquiries:", error);
      setInquiries((data as any) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Inquiries</h1>
        <Link href="/dashboard" className="text-sm text-slate">
          ← Back to listings
        </Link>
      </div>

      {loading ? (
        <p className="text-slate text-sm">Loading…</p>
      ) : inquiries.length === 0 ? (
        <p className="text-slate text-sm">
          No inquiries yet. They'll show up here as soon as someone contacts you about a listing.
        </p>
      ) : (
        <div className="divide-y divide-ink/10 bg-paper-raised rounded-sm border border-ink/10">
          {inquiries.map((inq) => (
            <div key={inq.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{inq.renter_name}</p>
                <p className="text-xs text-slate/70">
                  {new Date(inq.created_at).toLocaleDateString()}
                </p>
              </div>
              <Link
                href={`/properties/${inq.property_id}`}
                className="text-sm text-rust hover:underline"
              >
                {inq.properties?.title ?? "Listing"}
              </Link>
              <p className="text-sm text-slate mt-1">
                <a href={`tel:${inq.renter_phone}`} className="text-ink font-medium">
                  {inq.renter_phone}
                </a>
              </p>
              {inq.message && (
                <p className="text-sm text-ink/80 mt-1 italic">"{inq.message}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
