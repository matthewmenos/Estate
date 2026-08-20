import { supabaseServer } from "./supabase";

/**
 * Durable, atomic rate limiting backed by Postgres (see
 * supabase/migrations/0006_rate_limiting.sql) — replaces the in-memory
 * counters this project used to have, which reset on every deploy and
 * didn't work correctly across multiple serverless instances.
 *
 * Returns true if the request is allowed, false if the caller has exceeded
 * `maxAttempts` within `windowSeconds`.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    // Fail open with a warning rather than blocking real users if the RPC
    // itself has a problem — a broken rate limiter shouldn't take down the
    // feature it's protecting. Fix the underlying error if you see this.
    console.error("Rate limit check failed, allowing request:", error);
    return true;
  }

  return data === true;
}
