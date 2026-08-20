"use client";

import { useState } from "react";

export default function ReviewForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    setStatus("sending");
    setError(null);

    const res = await fetch("/api/reviews/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, rating, comment }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-ink bg-gold/10 border border-gold/30 rounded-xl p-4">
        Thanks for sharing your feedback!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl leading-none"
            >
              <span className={star <= (hoverRating || rating) ? "text-gold" : "text-ink/15"}>★</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="How was your experience renting this property?"
          className="w-full rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-rust">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-rust text-paper-raised py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {status === "sending" ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
