"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  verification_status: string;
  created_at: string;
};

export default function AdminVerifyPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  async function load() {
    const { data: userData } = await supabaseBrowser.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data: me } = await supabaseBrowser
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    if (!me?.is_admin) {
      setDenied(true);
      setLoading(false);
      return;
    }

    const { data } = await supabaseBrowser
      .from("profiles")
      .select("id, full_name, phone, verification_status, created_at")
      .neq("verification_status", "verified")
      .order("created_at", { ascending: true });

    setOwners(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: "verified" | "rejected") {
    await supabaseBrowser.from("profiles").update({ verification_status: status }).eq("id", id);
    setOwners((prev) => prev.filter((o) => o.id !== id));
  }

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate">Loading…</main>;
  if (denied)
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-rust">
        You don't have access to this page.
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold text-ink mb-1">Owner verification queue</h1>
      <p className="text-sm text-slate mb-6">
        Approve owners after confirming identity/ownership (phone call, ID check, etc. — outside this app for now).
      </p>

      {owners.length === 0 ? (
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
