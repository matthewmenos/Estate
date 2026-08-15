import { normalizeGhanaPhone } from "./arkesel";
import { timingSafeEqual } from "crypto";

function parseList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Checks whether a phone number or email is in the ADMIN_PHONES / ADMIN_EMAILS
 * env allowlist. Server-only — these env vars are never NEXT_PUBLIC-prefixed,
 * so this must only be called from API routes / server code, never a client
 * component.
 */
export function isConfiguredAdmin(params: { phone?: string | null; email?: string | null }) {
  const adminPhones = parseList(process.env.ADMIN_PHONES).map((p) => normalizeGhanaPhone(p));
  const adminEmails = parseList(process.env.ADMIN_EMAILS).map((e) => e.toLowerCase());

  if (params.phone && adminPhones.includes(normalizeGhanaPhone(params.phone))) return true;
  if (params.email && adminEmails.includes(params.email.toLowerCase())) return true;
  return false;
}

/**
 * A shared secret (ADMIN_PASSWORD) that lets any logged-in user self-promote
 * to admin by entering it — the bootstrap path for your very first admin
 * when you don't want to (or can't) match ADMIN_EMAILS/ADMIN_PHONES exactly.
 *
 * Uses a constant-time comparison so response timing can't be used to guess
 * the password character-by-character. Returns false (not a throw) if
 * ADMIN_PASSWORD isn't set — the feature is off by default.
 */
export function checkAdminPassword(candidate: string): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(configured);
  if (a.length !== b.length) return false; // timingSafeEqual requires equal length
  return timingSafeEqual(a, b);
}
