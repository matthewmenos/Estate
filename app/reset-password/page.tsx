"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthPageShell from "@/components/AuthPageShell";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, newPassword: password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthPageShell>
        <h1 className="text-2xl font-semibold text-ink mb-2">Password reset</h1>
        <p className="text-slate text-sm mb-6">
          Your password has been updated. You can now log in with your new password.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full rounded-sm bg-rust text-paper-raised py-2 text-sm font-medium"
        >
          Go to login
        </button>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <h1 className="text-2xl font-semibold text-ink mb-1">Reset your password</h1>
      <p className="text-slate text-sm mb-6">
        Enter the code sent to {phone || "your phone"} and choose a new password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Verification code</label>
          <input
            required
            inputMode="numeric"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm tracking-widest"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">New password</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Confirm new password</label>
          <input
            required
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-rust">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-rust text-paper-raised py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
