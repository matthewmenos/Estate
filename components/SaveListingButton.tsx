"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function SaveListingButton({
  propertyId,
  price,
}: {
  propertyId: string;
  price: number;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabaseBrowser
        .from("saved_listings")
        .select("id")
        .eq("property_id", propertyId)
        .eq("renter_id", userData.user.id)
        .maybeSingle();
      if (data) {
        setSaved(true);
        setSavedId(data.id);
      }
    }
    check();
  }, [propertyId]);

  async function toggle() {
    setLoading(true);
    const { data: userData } = await supabaseBrowser.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    if (saved && savedId) {
      await supabaseBrowser.from("saved_listings").delete().eq("id", savedId);
      setSaved(false);
      setSavedId(null);
    } else {
      const { data } = await supabaseBrowser
        .from("saved_listings")
        .insert({ property_id: propertyId, renter_id: userData.user.id, saved_price: price })
        .select("id")
        .single();
      setSaved(true);
      setSavedId(data?.id ?? null);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from saved listings" : "Save this listing"}
      className={`flex items-center justify-center gap-2 w-full rounded-full border py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        saved ? "border-rust bg-rust/10 text-rust" : "border-ink/20 text-ink hover:border-ink/40"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {saved ? "Saved" : "Save listing"}
    </button>
  );
}
