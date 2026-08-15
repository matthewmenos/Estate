import { normalizeGhanaPhone } from "./arkesel";

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
