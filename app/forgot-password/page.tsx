"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    setLoading(false);
    // Always proceed to the next step, regardless of whether the number
    // was actually found — the API deliberately doesn't reveal that.
    router.push(`/reset-password?phone=${encodeURIComponent(phone)}`);
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-bold text-ink mb-1">Forgot your password?</h1>
      <p className="text-slate text-sm mb-6">
        Enter the phone number on your account. We'll text you a code to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Phone number</label>
          <input
            required
            type="tel"
            placeholder="024 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-rust text-paper-raised py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send code"}
        </button>
      </form>
    </main>
  );
}
