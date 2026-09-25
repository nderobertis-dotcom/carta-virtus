-- ── TABELLA RICARICHE ──
create table if not exists public.ricariche (
  id              uuid primary key default gen_random_uuid(),
  tifoso_id       uuid not null references auth.users(id) on delete cascade,
  punti           integer not null check (punti > 0),
  importo_eur     numeric(8,2) not null check (importo_eur > 0),
  metodo          text not null default 'online' check (metodo in ('online', 'contanti', 'pos')),
  stato           text not null default 'in_attesa' check (stato in ('in_attesa', 'confermata', 'annullata')),
  note            text,
  confermata_da   uuid references auth.users(id) on delete set null,
  creato_il       timestamptz not null default now(),
  confermata_il   timestamptz
);

create index if not exists ricariche_tifoso_idx on public.ricariche(tifoso_id);
create index if not exists ricariche_stato_idx  on public.ricariche(stato);

alter table public.ricariche enable row level security;

create policy "ricariche_proprie_select" on public.ricariche
  for select using (true);

create policy "ricariche_inserimento" on public.ricariche
  for insert with check (true);

create policy "ricariche_update" on public.ricariche
  for update using (true) with check (true);

-- ── VIEW RICARICHE CON DATI TIFOSO ──
create or replace view public.ricariche_view as
select
  r.id, r.punti, r.importo_eur, r.metodo, r.stato, r.note,
  r.creato_il, r.confermata_il, r.tifoso_id,
  t.nome as tifoso_nome, t.cognome as tifoso_cognome, t.email as tifoso_email
from public.ricariche r
left join public.tifosi t on t.auth_user_id = r.tifoso_id;

grant select on public.ricariche_view to anon, authenticated;
