"use client";

import { useState } from "react";

export default function InquiryForm({ propertyId }: { propertyId: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        renterName: name,
        renterPhone: phone,
        message,
      }),
    });

    setStatus(res.ok ? "sent" : "error");
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-ink bg-gold/10 border border-gold/30 rounded-xl p-3">
        Sent. The owner will be in touch with you directly.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Your name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Your phone number</label>
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="I'm interested in viewing this property…"
          className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
        />
      </div>
      {status === "error" && (
        <p className="text-sm text-rust">Something went wrong — please try again.</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-xl bg-rust text-paper-raised py-2 text-sm font-medium hover:bg-rust-dark transition-colors disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Contact owner"}
      </button>
    </form>
  );
}
