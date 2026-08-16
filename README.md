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

## Round 7 — proper email confirmation + admin password bootstrap

### Email confirmation now handled correctly

Previously, signup assumed Supabase's "Confirm email" setting was off. Now both cases work:

- **If "Confirm email" is off:** unchanged — signup goes straight to phone verification.
- **If "Confirm email" is on:** signup shows a "check your email" screen. Clicking the emailed link lands the user on `/auth/callback`, which picks up their new session, finishes creating their profile, and forwards them to phone verification (using the name/phone they originally entered, carried through via Supabase's `user_metadata`).

If you turn "Confirm email" on, set the **Redirect URLs** allowlist in Supabase (Authentication → URL Configuration) to include your app's `/auth/callback` — Supabase rejects redirects to URLs not on that list.

### Admin password bootstrap

`ADMIN_PASSWORD` in `.env.local` is an optional master key: any logged-in user who enters it at `/admin/claim` immediately becomes an admin. This solves the original chicken-and-egg problem — previously, becoming the first admin required your account's email/phone to already match `ADMIN_EMAILS`/`ADMIN_PHONES` exactly, with no path for an existing account under different credentials.

- Every "you don't have access" screen under `/admin` now links to `/admin/claim`.
- The check uses a constant-time comparison (`checkAdminPassword` in `lib/adminConfig.ts`) so response timing can't leak the password character-by-character.
- There's a small in-memory attempt limiter (5 tries) on `/api/admin/claim` — it resets on every deploy/restart and isn't shared across serverless instances, so treat it as a speed bump, not real rate limiting. Worth replacing with something durable (Upstash/Redis, or a DB-backed counter) before this is exposed to real traffic.
- **Leave `ADMIN_PASSWORD` unset in production once you no longer need it.** It's a standing master key as long as it's set — fine for initial setup, but worth removing from your environment after you've claimed your admin account, then re-adding temporarily only if you need to bootstrap another admin later.

## Round 8 — hardened Arkesel configuration

`lib/arkesel.ts` was relying on a hardcoded sender ID and treating any HTTP 200 as success, which doesn't hold up against how Arkesel's API actually behaves. Fixed:

- **Sender ID is now env-configured** (`ARKESEL_SENDER_ID`) instead of hardcoded to `"AccraRent"` — set it to whatever you actually register and get approved in your Arkesel dashboard.
- **Fails fast with a clear error if `ARKESEL_API_KEY` is missing**, instead of letting it surface later as an opaque 401 from Arkesel that looks like a code bug.
- **Checks for logical errors in the response body, not just HTTP status.** Arkesel can return HTTP 200 with an error code in the body (`{"code": "1001", "message": "..."}`) — a request can "succeed" at the HTTP layer while failing logically. `sendPhoneOtp` now throws on this; `verifyPhoneOtp` treats it as "not verified" rather than a thrown error, since a wrong/expired code is an expected outcome, not a bug.
- **Retries once on transient network failure** (not on a wrong code, which won't fix itself by retrying) — a short backoff, per Arkesel's own guidance on handling flaky delivery.
- **Voice OTP fallback is wired in but unused by default** — `sendPhoneOtp(phone, "voice")` — Arkesel's documented fallback for numbers where SMS delivery is unreliable. Nothing calls this yet; worth adding a "didn't get it? Try a call instead" option on `/verify-phone` if SMS delivery turns out to be flaky for some networks.

**Still unverified against a real account** (same caveat as always): the specific success/error code values (`"1100"` for verify success, `"1001"` for missing-field) come from Arkesel's public docs and troubleshooting guides, not a live test. Confirm both against your own account's real responses before relying on this in production — log the raw `data` object from one real send/verify cycle and compare.

## Round 9 — 3D tilt houses + typography system

### Design decisions (worth knowing before you extend this)

**The house scene is deliberately scoped to entry/marketing surfaces, not the whole app.** It appears on the homepage hero (full scene, `components/TiltHouses.tsx` `variant="full"`) and behind the login/signup/verify-phone/forgot-password/reset-password forms (`variant="accent"`, via the new shared `components/AuthPageShell.tsx`). The dashboard, admin section, and property detail page stay undecorated — task-oriented screens benefit from focus, not ambient motion, and constant parallax behind a rent-tracking table would actively hurt usability. If you want it elsewhere later, wrap that page's content in `<AuthPageShell>` or drop `<TiltHouses variant="accent" />` into a `relative` container directly.

### How the tilt effect works

- **Desktop (has a mouse):** the whole house scene tilts in 3D (CSS `perspective` + `rotateX/rotateY`) following the cursor, and each house also drifts slightly on its own axis proportional to its "depth" — nearer houses (larger, more opaque) move more, giving real parallax rather than everything moving in lockstep.
- **Touch devices:** no mouse listener is attached at all (detected via `(hover: none)`) — houses still render with their gentle idle float, just without cursor-tilt. Deliberately did **not** wire up `deviceorientation`/gyroscope tilt — that requires an intrusive permission prompt on iOS Safari, which is a poor trade for a background decoration.
- **`prefers-reduced-motion`:** respected in two places — the JS never attaches the tilt listener, and a CSS media query independently kills the idle float animation. Belt-and-suspenders, so it can't slip through on some timing edge case.
- **Zero new dependencies** — pure CSS 3D transforms and `requestAnimationFrame`-throttled mousemove, no animation library.

### Typography changes

- Added a real fluid type scale to `tailwind.config.ts`: `text-hero` (clamps ~44px→72px depending on viewport, tight tracking, used only for the homepage headline) and `text-section` (clamps ~24px→34px, used for section headings).
- Fixed a real inconsistency: headings were mixing `font-bold` with the Zilla Slab display face, which already carries its own weight scale (500/600/700) — `font-bold` (700) was fighting the face's natural rhythm on some elements. Standardized all page headings to `font-semibold`.
- Added `text-balance` on the hero headline/subhead and a couple of section headings, so multi-line text wraps more evenly instead of leaving an orphaned word — a small detail, but a real readability improvement Tailwind 3.4+ supports natively.
- Global heading tracking tightened slightly (`letter-spacing: -0.01em` on all `h1`/`h2`/`h3`) for a more considered, less default-webfont feel.

### UI polish

- Added two elevation tokens (`shadow-soft`, `shadow-raised`) and applied them to property cards (lift + shadow on hover, replacing a flat border-color change) and the hero's CTA buttons (soft shadow at rest, raised + lifted on hover).

## Round 10 — mansion-style houses with per-house hover turn

Two real changes to `components/TiltHouses.tsx`, on top of the existing cursor-parallax scene:

**Honest scope note:** actual photographic mansions aren't something this build can include — that would mean either copyrighted stock photography (can't legally embed that) or an AI image-generation step outside what I have available here. What's built instead is more detailed, ornate vector illustrations (columns, pediments, a domed cupola, arched entrances, symmetric multi-window facades — three distinct "mansion-grade" facades, up from three plain gable-house silhouettes) that scale cleanly at any size and stay perfectly on-brand with the rest of the site's line-art system, including the header logo and verification seal.

**Per-house hover turn:** each mansion now responds individually when you hover it — it turns in 3D (`rotateY`/`rotateX`), scales up, lifts toward the viewer, and comes to full opacity, independent of the whole-scene cursor-parallax tilt that was already there. Alternating houses turn in opposite directions (`turnDir: 1 | -1` per house) so the row doesn't feel mechanical. This required making the house layer accept pointer events (previously the whole scene was `pointer-events-none` so it wouldn't interfere with the hero content) — only the individual house shapes are interactive; the empty space between them still passes clicks through to whatever's beneath.

**Z-index correctness:** a hovered house's z-index is deliberately capped below the hero content layer, so a mansion turning under your cursor can never visually cover or intercept clicks meant for the headline or CTA buttons, even if their positions overlap on a given viewport size.

**Reduced-motion:** the hover-turn still triggers (it's a direct response to a deliberate hover, not ambient background motion — different from the auto-playing float/parallax, which is fully suppressed), but for `prefers-reduced-motion` users it's a plain scale-up with no rotation, so there's still a moment of natural interactivity without the 3D spin.

## Round 11 — distinct admin dashboard + "schema cache" bug (not a code bug)

### The "public.properties schema cache" error

This wasn't a bug in the app code — grepped the whole codebase and there's no typo anywhere referencing a misspelled table name. This is a well-known Supabase/PostgREST gotcha: after running a migration that creates a new table, PostgREST's schema cache doesn't always pick it up immediately. Fix: **Settings → API → "Reload schema cache"** in your Supabase dashboard (or run `NOTIFY pgrst, 'reload schema';` in the SQL editor). Also worth double-checking all five migrations (`0001` through `0005`) actually ran, in order, if the cache reload doesn't fix it.

### Admin dashboard now visually distinct from the owner dashboard

Previously `/admin` reused the same light paper/rust theme as the rest of the site with a plain tab bar — easy to mistake for just another owner-facing page. Now:

- **`components/AdminShell.tsx`** — a dark control-panel shell (ink background, gold accents) with a real sidebar nav (top bar on mobile), applied automatically to every `/admin/*` page via **`app/admin/layout.tsx`**. The public site's light header/footer now hide themselves on admin routes (`SiteHeader.tsx`/`SiteFooter.tsx` check the pathname) so there's no visual clash or duplicate navigation.
- The access-guard check (`useAdminGuard`) is now centralized in `AdminShell` instead of repeated on every admin page — pages no longer each carry their own loading/denied states, and their data-fetching effects don't even mount until access is confirmed.
- **`/admin/claim` moved to `/admin-claim`** — it has to stay reachable by non-admins (that's its entire purpose), so it can't live inside a layout that gates on admin access.

### Admin now has real control over everything on the site, not just owners/properties

- **`/admin/tenants`** (new) — every tenant across every owner's properties, with current rent status.
- **`/admin/inquiries`** (new) — every inquiry submitted platform-wide, not just what an individual owner sees on their own dashboard.
- **Edit button added to `/admin/properties`** — links straight to the owner's own edit form (`/dashboard/edit/[id]`), which already works for admins on *any* property thanks to the `is_admin` RLS policies added in round 6 — this just makes that capability reachable from the UI instead of only existing at the database level.
- Owners (promote/demote admin) and Properties (unlist/relist/delete) — unchanged functionality, just restyled onto the new shell.
