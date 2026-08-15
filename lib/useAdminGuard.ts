"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export function useAdminGuard() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: me } = await supabaseBrowser
        .from("profiles")
        .select("is_admin")
        .eq("id", userData.user.id)
        .single();

      if (cancelled) return;

      if (me?.is_admin) {
        setStatus("allowed");
        return;
      }

      // Not currently an admin in the DB — check whether they're on the
      // env allowlist (ADMIN_PHONES / ADMIN_EMAILS) and, if so, get
      // promoted automatically rather than making them re-verify.
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json().catch(() => ({ isAdmin: false }));

      if (cancelled) return;
      setStatus(result.isAdmin ? "allowed" : "denied");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return status;
}
