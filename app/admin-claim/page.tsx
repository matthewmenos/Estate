"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function AdminClaimPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: userData } = await supabaseBrowser.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data: sessionData } = await supabaseBrowser.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/admin/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold text-ink mb-1">Claim admin access</h1>
      <p className="text-slate text-sm mb-6">
        Enter the admin password to grant your account admin access. You must be logged in first.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Admin password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-rust">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rust text-paper-raised py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Checking…" : "Claim admin access"}
        </button>
      </form>
    </main>
  );
}
