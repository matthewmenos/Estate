"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Without a monitoring service wired up, this is the only trace of the
    // error you'll have — check your hosting provider's function logs.
    // Worth connecting Sentry (sentry.io) or a similar service before
    // relying on this in production; console logging alone won't page you.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-sm px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink mb-2">
        Something went wrong
      </h1>
      <p className="text-slate text-sm mb-6">
        This has been logged. You can try again, or head back home.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="rounded-xl bg-rust text-paper-raised px-4 py-2 text-sm font-medium"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-ink text-ink px-4 py-2 text-sm font-medium"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
