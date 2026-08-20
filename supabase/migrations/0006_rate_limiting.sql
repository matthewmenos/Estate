create table public.rate_limits (
  key text primary key,
  attempts int not null default 0,
  window_start timestamptz not null default now()
);

-- No RLS policies needed — this table is only ever touched by
-- supabaseServer() (service role), never from the browser.
alter table public.rate_limits enable row level security;

-- Atomically checks and increments an attempt counter for `p_key` within a
-- sliding window of `p_window_seconds`. Returns true if the attempt is
-- allowed (under the limit), false if it should be rejected. Row-level
-- locking (via the UPSERT's implicit lock) makes this safe under concurrent
-- requests — unlike the in-memory Map it replaces, this works correctly
-- across multiple serverless instances and survives deploys/restarts.
create or replace function public.check_rate_limit(
  p_key text,
  p_max_attempts int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
as $$
declare
  current_row public.rate_limits%rowtype;
begin
  insert into public.rate_limits (key, attempts, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set attempts = case
          -- window expired — reset the counter
          when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then 1
          else public.rate_limits.attempts + 1
        end,
        window_start = case
          when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then now()
          else public.rate_limits.window_start
        end
  returning * into current_row;

  return current_row.attempts <= p_max_attempts;
end;
$$;

-- Housekeeping: old rows are tiny and harmless to keep, but if this table
-- grows large in practice, periodically delete rows with window_start older
-- than your longest window (e.g. `delete from rate_limits where window_start
-- < now() - interval '1 day'`) — worth adding to the existing cron job later.
