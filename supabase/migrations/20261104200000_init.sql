-- Schéma initial de l'appli highscores MDLR.
--
-- Un score suit un seul cycle de vie : un joueur l'envoie (status = 'pending'),
-- un bénévole le valide ou le rejette depuis l'admin. Un bénévole peut aussi
-- saisir un score à la main (source = 'admin'), directement validé.

-- ---------------------------------------------------------------------------
-- Admins : les bénévoles MDLR. Les inscriptions publiques sont fermées
-- (config.toml), on invite les comptes depuis le dashboard puis on les ajoute ici.
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

create policy "admins can read admins"
  on public.admins for select
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Jeux
-- ---------------------------------------------------------------------------
create type public.score_order as enum ('desc', 'asc');

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  -- La machine sur laquelle on joue (NES, SNES, PS2…), affichée sous le titre.
  machine text,
  -- 'desc' : plus c'est haut mieux c'est. 'asc' : un temps, plus c'est bas mieux c'est.
  score_order public.score_order not null default 'desc',
  -- Libellé optionnel de l'unité (« pts », « lignes », « s »).
  score_unit text,
  visible boolean not null default true,
  position integer not null default 0,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "anyone can read visible games"
  on public.games for select
  to anon, authenticated
  using (visible or (select public.is_admin()));

create policy "admins manage games"
  on public.games for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Scores (soumissions joueurs et saisies admin)
-- ---------------------------------------------------------------------------
create type public.score_status as enum ('pending', 'approved', 'rejected');
create type public.score_source as enum ('player', 'admin');

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 40),
  score bigint not null check (score >= 0),
  photo_path text,
  instagram_consent boolean not null default false,
  status public.score_status not null default 'pending',
  source public.score_source not null default 'player',
  rejection_reason text,
  instagram_post_id text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

create index scores_game_status_idx on public.scores (game_id, status);

alter table public.scores enable row level security;

-- Le public (écran, téléphone) ne voit que les scores validés des jeux visibles.
create policy "anyone can read approved scores"
  on public.scores for select
  to anon, authenticated
  using (
    (
      status = 'approved'
      and exists (
        select 1 from public.games g where g.id = game_id and g.visible
      )
    )
    or (select public.is_admin())
  );

-- Un joueur peut seulement envoyer une soumission en attente, sur un jeu visible.
create policy "players submit pending scores"
  on public.scores for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and source = 'player'
    and reviewed_at is null
    and reviewed_by is null
    and instagram_post_id is null
    and exists (
      select 1 from public.games g where g.id = game_id and g.visible
    )
  );

create policy "admins manage scores"
  on public.scores for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Classement : meilleurs scores validés par jeu, rang calculé selon le sens du jeu.
-- ---------------------------------------------------------------------------
create view public.leaderboard
with (security_invoker = true)
as
select
  s.id,
  s.game_id,
  s.player_name,
  s.score,
  s.photo_path,
  s.created_at,
  rank() over (
    partition by s.game_id
    order by
      case when g.score_order = 'desc' then s.score end desc,
      case when g.score_order = 'asc' then s.score end asc
  ) as rank
from public.scores s
join public.games g on g.id = s.game_id
where s.status = 'approved';

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger games_touch_updated_at
  before update on public.games
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Realtime : l'écran public se met à jour dès qu'un score est validé.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.scores, public.games;

-- ---------------------------------------------------------------------------
-- Storage : photos des joueurs et visuels des jeux.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('covers', 'covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

-- Les joueurs déposent leur photo dans submissions/, sans pouvoir lister ni écraser.
create policy "players upload submission photos"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = 'submissions'
  );

create policy "admins manage photos and covers"
  on storage.objects for all
  to authenticated
  using (bucket_id in ('photos', 'covers') and (select public.is_admin()))
  with check (bucket_id in ('photos', 'covers') and (select public.is_admin()));
