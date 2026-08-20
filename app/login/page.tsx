"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthPageShell from "@/components/AuthPageShell";
import { supabaseBrowser } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const { data: profile } = await supabaseBrowser
      .from("profiles")
      .select("phone_verified, role")
      .eq("id", data.user.id)
      .single();

    setLoading(false);
    if (!profile?.phone_verified) {
      router.push("/verify-phone");
    } else {
      router.push(profile.role === "renter" ? "/renter" : "/dashboard");
    }
  }

  return (
    <AuthPageShell>
      <h1 className="text-2xl font-semibold text-ink mb-1">Log in</h1>
      <p className="text-slate text-sm mb-6">Welcome back to Accra Rentals.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Password</label>
          <input
            type="password"
            required
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
          {loading ? "Logging in…" : "Log in"}
        </button>
        <p className="text-sm text-center">
          <Link href="/forgot-password" className="text-slate hover:text-rust hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="text-sm text-slate text-center">
          No account?{" "}
          <Link href="/signup" className="text-rust font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
