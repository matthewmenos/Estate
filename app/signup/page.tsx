"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabaseBrowser.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError || !data.user) {
      setLoading(false);
      setError(signUpError?.message ?? "Something went wrong.");
      return;
    }

    // NOTE: if your Supabase project has "Confirm email" enabled, data.session
    // will be null here until the user clicks the confirmation link — in that
    // case this profile upsert (and the OTP send after it) needs to happen
    // after they confirm and log in, not immediately. Disable email
    // confirmation for now, or adapt this flow, depending on what you want.
    await supabaseBrowser.from("profiles").upsert(
      { id: data.user.id, full_name: form.name, email: form.email },
      { onConflict: "id" }
    );

    // Kick off phone verification right away.
    const { data: sessionData } = await supabaseBrowser.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ phone: form.phone }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Account created, but sending the code failed. Try again from the next screen.");
    }

    router.push(`/verify-phone?phone=${encodeURIComponent(form.phone)}`);
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-bold text-ink mb-1">Create your owner account</h1>
      <p className="text-slate text-sm mb-6">List and manage your properties on Accra Rentals.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Phone number</label>
          <input
            required
            type="tel"
            placeholder="024 123 4567"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate mt-1">We'll text a code to confirm this number.</p>
        </div>
        {error && <p className="text-sm text-rust">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-rust text-paper-raised py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
        <p className="text-sm text-slate text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-rust font-medium hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
