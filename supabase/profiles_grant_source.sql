-- Gojito: track why an account has guac (founder vs demo helper vs wind-test click).
-- Apply after profiles.sql.

alter table public.profiles add column if not exists grant_source text;

comment on column public.profiles.grant_source is
  'founder_pass = lifetime; demo_helper = timed thank-you; demo_interest = pre-founder fake-door click.';

-- Optional sanity index for cohort queries at founder-pass launch:
-- select id, email, grant_source, guac_expires_at from public.profiles where grant_source is not null;
