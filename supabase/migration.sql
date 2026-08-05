-- Crowd vs Model — run this once in the Supabase SQL editor.
-- Hackathon setup: no auth, RLS left off, anon key used from the browser.

create extension if not exists "pgcrypto";

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'lobby',
  current_round int not null default 0,
  crowd_score int not null default 0,
  model_score int not null default 0,
  round_started_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  idx int not null,
  body text not null,
  truth text not null,
  model_answer text not null,
  model_confidence int not null,
  source_note text,
  unique (game_id, idx)
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  nickname text not null,
  score int not null default 0,
  joined_at timestamptz not null default now()
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  choice text not null,
  created_at timestamptz not null default now(),
  unique (round_id, player_id)
);

create index if not exists votes_round_idx on votes(round_id);
create index if not exists players_game_idx on players(game_id);
create index if not exists rounds_game_idx on rounds(game_id);

-- Award a point to every player who matched the truth for this round.
create or replace function score_round(p_round uuid)
returns void language sql as $$
  update players p
  set score = p.score + 1
  from votes v
  join rounds r on r.id = v.round_id
  where v.round_id = p_round
    and v.player_id = p.id
    and v.choice = r.truth;
$$;

-- Realtime
alter publication supabase_realtime add table games;
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table players;

alter table games replica identity full;
alter table votes replica identity full;
alter table players replica identity full;
