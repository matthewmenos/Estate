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
