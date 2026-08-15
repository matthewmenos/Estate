"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";

export default function SiteHeader() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
    });
  }, []);

  return (
    <header className="border-b border-ink/10 bg-paper-raised">
      <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 100 100" aria-hidden="true">
            <path
              d="M18 62 L18 40 L50 20 L82 40 L82 62"
              fill="none"
              stroke="#9C3F24"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="18" y1="62" x2="82" y2="62" stroke="#9C3F24" strokeWidth="7" strokeLinecap="round" />
          </svg>
          <span className="font-display text-lg font-semibold text-ink tracking-tight">
            Accra Rentals
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium text-ink">
          <Link href="/" className="hidden sm:inline hover:text-rust transition-colors">
            Browse
          </Link>
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-ink text-paper-raised px-4 py-2 hover:bg-ink-soft transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-ink px-4 py-2 hover:bg-ink hover:text-paper-raised transition-colors"
            >
              Owner login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
