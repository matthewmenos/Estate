-- Phone is now collected separately (via Arkesel OTP), so it's no longer
-- guaranteed at signup time the way Supabase phone-auth guaranteed it.
alter table public.profiles alter column phone drop not null;
alter table public.profiles add column phone_verified boolean not null default false;
alter table public.profiles add column email text;

-- Note: profile insert on signup is already covered by the existing
-- "Owners manage their own profile" policy (for all) from 0001_init.sql —
-- no new insert policy needed here.
