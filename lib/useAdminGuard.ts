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
      setStatus(me?.is_admin ? "allowed" : "denied");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return status;
}
