-- Appliquée directement sur la base le 2026-11-27.
-- Faille corrigée : les vues publiques (security definer) étaient modifiables par anon/authenticated.
revoke insert, update, delete, truncate, references, trigger on public.creators_public, public.brands_public, public.brand_signal_stats from anon, authenticated;
alter function public.legal_events_readonly() set search_path = public, pg_temp;

-- Le taux de commission n'est plus exposé publiquement
drop view public.brands_public;
create view public.brands_public as
  select id, name, website_url, status, currency from public.brands where status = 'active';
revoke all on public.brands_public from anon, authenticated;
grant select on public.brands_public to anon, authenticated;

create index if not exists posts_creator_id_idx on public.posts (creator_id);
create index if not exists products_post_id_idx on public.products (post_id);
create index if not exists clicks_post_id_idx on public.clicks (post_id);
create index if not exists moderation_notices_user_id_idx on public.moderation_notices (user_id);
create index if not exists notifications_post_id_idx on public.notifications (post_id);
create index if not exists notifications_actor_id_idx on public.notifications (actor_id);
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);
create index if not exists copyright_reports_post_id_idx on public.copyright_reports (post_id);
create index if not exists search_clicks_post_id_idx on public.search_clicks (post_id);
