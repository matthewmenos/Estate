"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();

  // Admin section has its own dark shell — skip the duplicate dark footer.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <footer className="bg-ink text-paper mt-16">
      <div className="mx-auto max-w-5xl px-4 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold">Accra Rentals</p>
          <p className="text-sm text-paper/60 mt-1">
            Built for owners. Trusted by renters.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-xs text-paper/50 hover:text-paper transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-xs text-paper/50 hover:text-paper transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
