"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/useAdminGuard";
import { supabaseBrowser } from "@/lib/supabase";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/owners", label: "Owners" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/verify", label: "Verification queue" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const status = useAdminGuard();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
  }

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-paper/70 text-sm">
        Checking access…
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-paper px-4">
        <div className="text-center">
          <p className="text-sm text-paper/70 mb-2">You don't have admin access.</p>
          <Link href="/admin-claim" className="text-gold-soft hover:underline text-sm">
            Have an admin password?
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col md:flex-row">
      {/* Sidebar (desktop) / top bar (mobile) — dark, deliberately distinct from
          the light paper/rust owner-facing site, so it reads as a different,
          more serious surface the moment it loads. */}
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-paper/10">
        <div className="px-4 py-5">
          <p className="font-display text-lg font-semibold text-paper">Accra Rentals</p>
          <p className="text-xs text-gold-soft tracking-wide uppercase mt-0.5">Admin</p>
        </div>
        <nav className="flex md:flex-col gap-1 px-2 pb-4 overflow-x-auto md:overflow-visible">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-paper/10 text-gold-soft"
                    : "text-paper/70 hover:text-paper hover:bg-paper/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 pb-5 border-t border-paper/10 pt-3 hidden md:block space-y-1">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-sm text-sm text-paper/60 hover:text-paper hover:bg-paper/5 transition-colors"
          >
            My owner dashboard
          </Link>
          <Link
            href="/"
            className="block px-3 py-2 rounded-sm text-sm text-paper/60 hover:text-paper hover:bg-paper/5 transition-colors"
          >
            View site
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-3 py-2 rounded-sm text-sm text-paper/60 hover:text-paper hover:bg-paper/5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content area stays light — dark chrome + light workspace is the
          standard admin-panel pattern, and keeps data tables/forms readable. */}
      <main className="flex-1 bg-paper min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
