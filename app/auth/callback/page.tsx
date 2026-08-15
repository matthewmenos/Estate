"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function finish() {
      // The Supabase client (detectSessionInUrl, on by default) picks up the
      // access token from the confirmation link's URL fragment automatically
      // — but that happens async, so poll briefly for the session to land.
      let session = null;
      for (let i = 0; i < 10 && !session; i++) {
        const { data } = await supabaseBrowser.auth.getSession();
        session = data.session;
        if (!session) await new Promise((r) => setTimeout(r, 300));
      }

      if (!session) {
        setError("This confirmation link is invalid or has expired. Try signing up again.");
        return;
      }

      const user = session.user;
      const fullName = (user.user_metadata?.full_name as string) ?? "";
      const pendingPhone = (user.user_metadata?.pending_phone as string) ?? "";

      // Finish creating the profile now that we have a confirmed session
      // (this was deferred from signup since there was no session yet then).
      await supabaseBrowser.from("profiles").upsert(
        { id: user.id, full_name: fullName, email: user.email },
        { onConflict: "id" }
      );

      if (pendingPhone) {
        await fetch("/api/otp/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ phone: pendingPhone }),
        });
        router.push(`/verify-phone?phone=${encodeURIComponent(pendingPhone)}`);
      } else {
        // No pending phone on file (e.g. link opened in a different browser
        // than it was requested in) — send them to log in normally instead.
        router.push("/login");
      }
    }

    finish();
  }, [router]);

  if (error) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16 text-sm text-rust">
        {error}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-sm text-slate">
      Confirming your email…
    </main>
  );
}
