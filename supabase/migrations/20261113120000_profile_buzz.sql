-- Page créateur : look « En ce moment » (le plus ouvert depuis 1 h)
-- À exécuter une fois dans Supabase > SQL Editor. Peut être relancé sans risque.

-- ———————————————————————————————————————————————
-- « En ce moment » : quel look est le plus ouvert depuis 1 heure
--    Anonyme : on ne garde qu'une empreinte (hachée) du visiteur, effacée après 48 h,
--    comme pour le comptage des vues. 1 ouverture max par visiteur et par look toutes les 30 min,
--    le créateur ne compte pas ses propres ouvertures.
-- ———————————————————————————————————————————————
create table if not exists public.look_opens (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.posts(id) on delete cascade,
  creator_id uuid not null,
  viewer_hash text not null,
  opened_at timestamptz not null default now()
);
create index if not exists look_opens_creator_time_idx on public.look_opens (creator_id, opened_at desc);
create index if not exists look_opens_dedupe_idx on public.look_opens (post_id, viewer_hash, opened_at desc);
alter table public.look_opens enable row level security;
-- aucune politique : on n'y accède que par les deux fonctions ci-dessous

create or replace function public.log_look_open(p_post uuid, p_device text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
  v_key text;
  v_hash text;
  v_headers json;
begin
  select creator_id into v_creator from public.posts where id = p_post;
  if v_creator is null then return; end if;
  if auth.uid() is not null and auth.uid() = v_creator then return; end if;

  begin
    v_headers := current_setting('request.headers', true)::json;
  exception when others then
    v_headers := null;
  end;
  v_key := coalesce(
    nullif(left(coalesce(p_device, ''), 64), ''),
    case when auth.uid() is not null then 'u:' || auth.uid()::text end,
    split_part(coalesce(v_headers ->> 'x-forwarded-for', v_headers ->> 'x-real-ip', ''), ',', 1),
    'anon'
  );
  v_hash := md5(v_key || ':' || p_post::text);

  if exists (
    select 1 from public.look_opens
    where post_id = p_post and viewer_hash = v_hash and opened_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  -- plafond anti-abus : 300 ouvertures par heure et par look suffisent pour repérer le buzz
  if (select count(*) from public.look_opens where post_id = p_post and opened_at > now() - interval '1 hour') >= 300 then
    return;
  end if;

  insert into public.look_opens (post_id, creator_id, viewer_hash) values (p_post, v_creator, v_hash);

  -- ménage de temps en temps : rien n'est gardé plus de 48 h
  if random() < 0.02 then
    delete from public.look_opens where opened_at < now() - interval '48 hours';
  end if;
end;
$$;

-- Le look le plus ouvert : d'abord sur la dernière heure, sinon sur les dernières 24 h
create or replace function public.creator_buzz(p_creator uuid)
returns table (post_id uuid, opens bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
    select o.post_id, count(*)::bigint
    from public.look_opens o
    where o.creator_id = p_creator and o.opened_at > now() - interval '1 hour'
    group by o.post_id
    having count(*) >= 3
    order by count(*) desc, max(o.opened_at) desc
    limit 1;
  if found then return; end if;

  return query
    select o.post_id, count(*)::bigint
    from public.look_opens o
    where o.creator_id = p_creator and o.opened_at > now() - interval '24 hours'
    group by o.post_id
    having count(*) >= 5
    order by count(*) desc, max(o.opened_at) desc
    limit 1;
end;
$$;

revoke all on function public.log_look_open(uuid, text) from public;
revoke all on function public.creator_buzz(uuid) from public;
grant execute on function public.log_look_open(uuid, text) to anon, authenticated;
grant execute on function public.creator_buzz(uuid) to anon, authenticated;
