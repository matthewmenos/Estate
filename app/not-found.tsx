import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-sm px-4 py-24 text-center">
      <svg width="56" height="56" viewBox="0 0 100 100" className="mx-auto mb-6" aria-hidden="true">
        <path
          d="M18 62 L18 40 L50 20 L82 40 L82 62"
          fill="none"
          stroke="#FF5A36"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="18" y1="62" x2="82" y2="62" stroke="#FF5A36" strokeWidth="8" strokeLinecap="round" />
      </svg>
      <h1 className="font-display text-2xl font-semibold text-ink mb-2">Page not found</h1>
      <p className="text-slate text-sm mb-6">
        This listing or page doesn't exist — it may have been removed or the link might be wrong.
      </p>
      <Link
        href="/"
        className="inline-block rounded-full bg-rust text-paper-raised px-5 py-2.5 text-sm font-medium hover:bg-rust-dark transition-colors"
      >
        Back to listings
      </Link>
    </main>
  );
}
