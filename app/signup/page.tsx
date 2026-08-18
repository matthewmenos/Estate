"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthPageShell from "@/components/AuthPageShell";
import { supabaseBrowser } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // emailRedirectTo tells Supabase where to send the user after they click
    // the confirmation link in their email — /auth/callback picks the flow
    // back up from there. We also stash their name/phone in user_metadata so
    // /auth/callback can finish creating the profile without asking again.
    const { data, error: signUpError } = await supabaseBrowser.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: form.name, pending_phone: form.phone },
      },
    });

    if (signUpError || !data.user) {
      setLoading(false);
      setError(signUpError?.message ?? "Something went wrong.");
      return;
    }

    // If "Confirm email" is OFF in your Supabase project, signUp() returns
    // an active session immediately and we can continue straight to phone
    // verification. If it's ON, data.session is null — the user must click
    // the emailed link first, which lands them on /auth/callback instead.
    if (data.session) {
      await supabaseBrowser.from("profiles").upsert(
        { id: data.user.id, full_name: form.name, email: form.email },
        { onConflict: "id" }
      );

      const token = data.session.access_token;
      await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: form.phone }),
      });

      setLoading(false);
      router.push(`/verify-phone?phone=${encodeURIComponent(form.phone)}`);
      return;
    }

    setLoading(false);
    setAwaitingConfirmation(true);
  }

  if (awaitingConfirmation) {
    return (
      <AuthPageShell>
        <h1 className="text-2xl font-semibold text-ink mb-2">Check your email</h1>
        <p className="text-slate text-sm">
          We sent a confirmation link to <strong>{form.email}</strong>. Click it to
          activate your account — you'll come straight back here to verify your
          phone number next.
        </p>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <h1 className="text-2xl font-semibold text-ink mb-1">Create your owner account</h1>
      <p className="text-slate text-sm mb-6">List and manage your properties on Accra Rentals.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
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
            className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
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
            className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate mt-1">We'll text a code to confirm this number.</p>
        </div>
        {error && <p className="text-sm text-rust">{error}</p>}
        <p className="text-xs text-slate text-center">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-rust hover:underline">Terms</Link> and{" "}
          <Link href="/privacy" className="text-rust hover:underline">Privacy Policy</Link>.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rust text-paper-raised py-2.5 text-sm font-medium disabled:opacity-50"
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
    </AuthPageShell>
  );
}
