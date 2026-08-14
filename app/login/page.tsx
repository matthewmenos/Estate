"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ghana numbers: normalize local format (0XXXXXXXXX) to E.164 (+233XXXXXXXXX)
  function normalizePhone(input: string) {
    const digits = input.replace(/\D/g, "");
    if (digits.startsWith("233")) return `+${digits}`;
    if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
    return `+${digits}`;
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      phone: normalizePhone(phone),
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("otp");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabaseBrowser.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: otp,
      type: "sms",
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    // Ensure a profile row exists for this user (first login only).
    const userId = data.user?.id;
    if (userId) {
      await supabaseBrowser
        .from("profiles")
        .upsert({ id: userId, phone: normalizePhone(phone) }, { onConflict: "id" });
    }

    router.push("/dashboard");
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-bold text-brand-dark mb-1">Owner login</h1>
      <p className="text-gray-500 text-sm mb-6">
        List and manage your properties on Accra Rentals.
      </p>

      {step === "phone" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone number</label>
            <input
              type="tel"
              required
              placeholder="024 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Sending code…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Enter the code sent to {phone}
            </label>
            <input
              type="text"
              required
              inputMode="numeric"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm tracking-widest"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify & log in"}
          </button>
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="w-full text-sm text-gray-500"
          >
            Use a different number
          </button>
        </form>
      )}
    </main>
  );
}
