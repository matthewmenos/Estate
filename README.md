# Accra Rentals — MVP Scaffold

A starting point for a landlord-focused property listing platform in Accra, Ghana.
Next.js (App Router) + TypeScript + Tailwind + Supabase (Postgres + Auth) + Cloudflare R2 (photo storage).

## What's included

- Public listings page (`app/page.tsx`) — server-rendered, reads from Supabase
- DB schema (`supabase/migrations/0001_init.sql`) — profiles, properties, property_media, inquiries, with Row Level Security policies
- Presigned upload flow (`lib/r2.ts`, `app/api/upload/route.ts`) — browser uploads photos directly to R2
- Inquiry API (`app/api/inquiries/route.ts`) — lets a renter contact an owner through the platform

- Owner login (`app/login/page.tsx`) — phone OTP via Supabase Auth
- Owner dashboard (`app/dashboard/page.tsx`) — lists the logged-in owner's own properties
- New listing form (`app/dashboard/new/page.tsx`) — property details + multi-photo upload straight to R2
- Edit/delete listing (`app/dashboard/edit/[id]/page.tsx`) — update any field or delete the listing; protected by Row Level Security, not just UI
- Inquiries inbox (`app/dashboard/inquiries/page.tsx`) — every inquiry across all the owner's properties, most recent first, with a tap-to-call phone link
- Property detail page (`app/properties/[id]/page.tsx`) — photo gallery + inquiry form
- Inquiry form component (`components/InquiryForm.tsx`)

## What's NOT included yet (by design — see MVP scope discussion)

- Tenant/rent tracking dashboard
- Payments
- Owner verification UI (the `verification_status` field exists on `profiles`, but there's no admin screen to review/approve it yet — for the first users, flip it manually in the Supabase table editor)
- Marking an inquiry as "read" or archiving it
- Reordering/deleting individual photos on an existing listing (currently photos are only added at creation time)

## Setup

### 1. Supabase
1. Create a project at supabase.com (free tier is fine).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`.
3. Go to Project Settings → API and copy your URL, anon key, and service role key into `.env.local` (copy `.env.example` first).
4. Enable phone auth: Authentication → Providers → Phone (you'll need to configure an SMS provider like Twilio or MessageBird — Supabase's docs walk through this).

### 2. Cloudflare R2
1. In the Cloudflare dashboard, go to R2 → Create bucket (e.g. `accra-rentals-media`).
2. R2 → Manage API Tokens → create a token with read/write access to the bucket. Copy the Account ID, Access Key ID, and Secret Access Key into `.env.local`.
3. To serve images publicly: either enable the bucket's public R2.dev URL (fine for testing) or connect a custom domain (R2 → your bucket → Settings → Custom Domains) — recommended before launch, since it lets you put Cloudflare's CDN/caching in front of images.
4. Set `R2_PUBLIC_URL` in `.env.local` to whichever URL you're using.

### 3. Run locally
```bash
npm install
cp .env.example .env.local   # then fill in your real values
npm run dev
```

## Suggested next build steps

1. Owner signup/login page using Supabase phone auth
2. "New listing" form: property details + photo upload (call `/api/upload` for each photo to get a presigned URL, PUT the file directly to R2, then insert a `property_media` row with the returned `key`/`publicUrl`)
3. Property detail page (`app/properties/[id]/page.tsx`) with an inquiry form that posts to `/api/inquiries`
4. Simple admin view for manually verifying new owners (flip `verification_status` in `profiles`)

## Round 2 additions

- **Admin verification queue** (`app/admin/verify/page.tsx`) — approve/reject pending owners. Make yourself an admin by running the commented SQL at the bottom of `0002_admin_and_views.sql` in the Supabase SQL editor.
- **Search/filter on the homepage** (`components/ListingsFilter.tsx`) — filter by listing type, min bedrooms, max price. Client-side over the already-fetched list; fine at MVP scale, worth moving server-side once you have hundreds of listings.
- **WhatsApp contact button** (`components/WhatsAppButton.tsx`) — deep-links to `wa.me` with a prefilled message, shown alongside the in-app inquiry form so you can see which one renters actually use.
- **View counts** — `properties.view_count`, incremented via the `increment_property_views` RPC (avoids a read-modify-write race) each time someone loads a property page. Visible on the owner dashboard.
- **Image resizing at upload** — `/api/upload` now accepts a raw file, resizes it with `sharp` into thumb (400px) / medium (1200px) / capped-original (2000px) WebP variants, and pushes all three to R2. Cards use `thumb_url`, the detail gallery uses `medium_url`.
- **Photo manager on the edit page** (`components/PhotoManager.tsx`) — add photos, remove them, reorder with arrow buttons. First photo is the cover.
- **Per-listing SEO metadata** — `generateMetadata` on the property detail page sets a dynamic title, description, and Open Graph image per listing.

### Run the new migration

In the Supabase SQL editor, after `0001_init.sql`, also run `supabase/migrations/0002_admin_and_views.sql`.

## Round 3 additions — tenants, rent tracking, and Hubtel mobile money

- **Tenant management** (`app/dashboard/tenants/`) — add a tenant to a property (marks it occupied), view all tenants with their latest rent status at a glance, and a per-tenant detail page with full payment history.
- **Rent payment tracking** (`0003_tenants_and_payments.sql`) — a `rent_payments` table per tenant. Add a due payment for any date, then either mark it paid manually or send a real mobile money charge request.
- **Hubtel mobile money integration** (`lib/hubtel.ts`, `app/api/payments/initiate`, `app/api/payments/callback`) — "Request MoMo" on a pending payment sends a charge prompt to the tenant's phone via Hubtel's Receive Money API. Hubtel calls `/api/payments/callback` with the result, which updates the payment to `paid` or `failed`.

### Setting up Hubtel

1. Create a merchant account at [unity.hubtel.com](https://unity.hubtel.com) and set up a **Receive Money (POS Sales)** account — this gives you a POS Sales ID.
2. Generate a Client ID + Client Secret under API settings.
3. Add `HUBTEL_CLIENT_ID`, `HUBTEL_CLIENT_SECRET`, `HUBTEL_POS_SALES_ID`, and `APP_BASE_URL` to `.env.local`.
4. **Important:** Hubtel's callback needs a publicly reachable URL — `localhost` won't work. Use a tunnel (`ngrok http 3000` or `cloudflared tunnel`) for local testing, or just test this feature after deploying to Vercel.
5. The exact callback payload shape can vary by Hubtel account/integration type — `app/api/payments/callback/route.ts` reads a few common field name variants defensively, but it's worth triggering one real test payment and logging the raw callback body to confirm the shape matches what your account sends.

### Run the new migration

Run `supabase/migrations/0003_tenants_and_payments.sql` in the Supabase SQL editor, after `0001` and `0002`.

### What's still manual

- No automatic recurring due-date generation yet — you add each month's due payment by hand on the tenant page. Worth automating (e.g. a scheduled function that creates next month's payment a few days before `rent_due_day`) once this is validated.
- No SMS/WhatsApp reminder when a payment is overdue.

## Round 4 — email/password login + Arkesel phone verification

Owner auth no longer uses Supabase's built-in phone-OTP login (which only supports Twilio/MessageBird/Vonage/Textlocal). Instead:

- **Signup** (`app/signup/page.tsx`) — email + password via Supabase Auth, plus name and phone. Creates the account, then immediately sends a phone verification code.
- **Phone verification** (`app/verify-phone/page.tsx`) — enter the 6-digit code. Verification itself happens through **Arkesel's OTP API** (`lib/arkesel.ts`), not Supabase — Arkesel generates, sends, and verifies the code; we just call their `/send` and `/verify` endpoints and mark `profiles.phone_verified = true` on success.
- **Login** (`app/login/page.tsx`) — plain email + password. Redirects to phone verification if not yet completed.

### Setting up Arkesel

1. Create an account at [arkesel.com](https://arkesel.com) and grab your **Main API key** from the dashboard (the OTP endpoints specifically reject scoped/sub keys — a common first-integration gotcha).
2. Register a sender ID (the `sender_id` field in `lib/arkesel.ts`, currently `"AccraRent"` — update it to whatever you register, and note sender ID approval can take a little time).
3. Add `ARKESEL_API_KEY` to `.env.local`.
4. **Confirm the exact API contract before relying on it.** I built `lib/arkesel.ts` from Arkesel's publicly documented OTP endpoints, but their docs explicitly say to confirm the current request/response shape before shipping — in particular, double check the `verify` endpoint's success field (`verifyPhoneOtp` in `lib/arkesel.ts` checks a couple of likely field names defensively, but hasn't been tested against a real response).

### Important Supabase setting to check

If your Supabase project has **"Confirm email" enabled** (Authentication → Providers → Email), a new user's session won't be active immediately after `signUp()` — they'd need to click an email link first. The current signup flow assumes email confirmation is **off**, so the profile upsert and OTP send can happen right away. If you want email confirmation on, the profile creation + phone verification step needs to move to after their first login instead — flag this if you want that adjustment.

### Run the new migration

Run `supabase/migrations/0004_email_auth_and_phone_verification.sql` after `0001`–`0003`.

## Round 5 — forgot password via phone

Since login is email/password but phone is the verified identifier, password reset goes through phone, not email:

- **Forgot password** (`app/forgot-password/page.tsx`) — enter your phone number.
- **Reset password** (`app/reset-password/page.tsx`) — enter the Arkesel code sent to that phone, plus a new password.
- Verification reuses the same Arkesel OTP endpoints as signup. On a verified code, the password is updated server-side via `supabase.auth.admin.updateUserById` (`app/api/password-reset/confirm/route.ts`) — an admin-only call that only ever runs with the service role key, never exposed to the browser.

**Security notes worth knowing:**
- `/api/password-reset/request` always returns the same generic response whether or not the phone number is registered, so the endpoint can't be used to check who has an account.
- Only phone numbers with `phone_verified = true` can trigger a reset — an unverified/unclaimed number can't be used to hijack an account.
- There's no rate limiting on reset attempts yet. Fine for early testing, but worth adding (e.g. via Supabase's rate limit settings, or a simple attempts counter) before this is exposed to real users, so someone can't hammer the endpoint guessing codes.

## Round 6 — full admin dashboard

`/admin` is now a proper section, not just the verification queue:

- **Overview** (`app/admin/page.tsx`) — platform-wide stats: total owners, pending verifications, properties (available/total), tenants, inquiries, and total rent collected. Cards link to the relevant management page.
- **Owners** (`app/admin/owners/page.tsx`) — every registered owner, verification status, listing count, and a toggle to grant/revoke admin access to other users.
- **Properties** (`app/admin/properties/page.tsx`) — every listing platform-wide regardless of owner, filterable by status, with Unlist/Relist and permanent Delete actions — for moderating spam or problem listings.
- **Verification queue** (`app/admin/verify/page.tsx`) — unchanged functionally, just moved onto the shared admin layout below.

All four share `lib/useAdminGuard.ts` (checks `is_admin`, redirects otherwise) and `components/AdminNav.tsx` (the tab bar across the top). The "Admin" link only appears in the site header for users with `is_admin = true`.

**Database access:** admins previously could only read/update `profiles` (for verification). `0005_admin_full_access.sql` adds the same `is_admin` escape hatch as RLS policies on `properties`, `property_media`, `inquiries`, `tenants`, and `rent_payments`, so the new pages can actually see and moderate everything.

### Run the new migration

Run `supabase/migrations/0005_admin_full_access.sql` after `0001`–`0004`.

### First admin

Same as before — run this once in the Supabase SQL editor for your own account:
```sql
update public.profiles set is_admin = true where phone = '+233XXXXXXXXX';
```
After that, you can promote further admins directly from `/admin/owners` instead of touching SQL again.

## Round 7 — admin config via env, no more manual SQL

Admin status is now driven by `ADMIN_PHONES` / `ADMIN_EMAILS` in `.env.local` instead of a one-off SQL command:

- **How promotion happens:** the DB's `is_admin` column is still what Row Level Security actually checks (env vars aren't readable from SQL policies), but it's now kept in sync with your env allowlist automatically:
  - On phone verification (`app/api/otp/verify`) — if the phone or account email matches, `is_admin` is set on the spot.
  - On visiting `/admin` — `lib/useAdminGuard.ts` calls `/api/admin/sync` before denying access, which re-checks the allowlist and promotes if it matches. This covers anyone added to the env *after* they already verified — no need to re-verify their phone.
- **This only ever promotes, never demotes.** Removing someone from `ADMIN_PHONES`/`ADMIN_EMAILS` won't automatically revoke existing admin access — use the toggle on `/admin/owners` for that. Auto-demotion on env change felt like the wrong default (a redeploy shouldn't silently lock someone out mid-session).
- **The `/admin/owners` manual toggle still exists** as an override, for promoting someone not on the env list (e.g. a support hire) without redeploying.
- **Heads up on the header:** the "Admin" link in the site header reads directly from the DB (not the env check) to avoid an extra API call on every page load. If you've just added yourself to `ADMIN_PHONES`/`ADMIN_EMAILS`, the link won't appear until you've visited `/admin` once directly by URL — after that, the DB is updated and the header shows it normally.

### Setting your admin phone/email

Add your number and/or email to `.env.local`:
```
ADMIN_PHONES=+233241234567
ADMIN_EMAILS=you@example.com
```
Then just sign up normally and visit `/admin` — no SQL required.
