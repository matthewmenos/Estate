"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthPageShell from "@/components/AuthPageShell";
import { supabaseBrowser } from "@/lib/supabase";

function VerifyPhoneForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function authHeader() {
    const { data } = await supabaseBrowser.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token}` };
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ phone, code }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Verification failed.");
      return;
    }
    router.push("/dashboard");
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setNotice(null);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ phone }),
    });

    setResending(false);
    if (!res.ok) {
      setError("Failed to resend code.");
      return;
    }
    setNotice("Code resent.");
  }

  return (
    <AuthPageShell>
      <h1 className="text-2xl font-semibold text-ink mb-1">Verify your phone</h1>
      <p className="text-slate text-sm mb-6">
        We sent a 6-digit code to {phone || "your phone"}.
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
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
        {error && <p className="text-sm text-rust">{error}</p>}
        {notice && <p className="text-sm text-ink">{notice}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-rust text-paper-raised py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="w-full text-sm text-slate"
        >
          {resending ? "Resending…" : "Resend code"}
        </button>
      </form>
    </AuthPageShell>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={null}>
      <VerifyPhoneForm />
    </Suspense>
  );
}
