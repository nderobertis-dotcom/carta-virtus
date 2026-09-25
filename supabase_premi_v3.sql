-- ── TABELLA PREMI ──
create table if not exists public.premi (
  id              uuid primary key default gen_random_uuid(),
  titolo          text not null,
  descrizione     text,
  tipo            text not null default 'coupon' check (tipo in ('prodotto', 'esperienza', 'coupon')),
  costo_punti     integer not null check (costo_punti > 0),
  quantita_max    integer default null,
  quantita_usata  integer not null default 0,
  validita_giorni integer not null default 30,
  valido_fino     date default null,
  partner_id      uuid references public.partner(id) on delete set null,
  attivo          boolean not null default true,
  creato_il       timestamptz not null default now()
);

-- ── TABELLA RISCATTI ──
create table if not exists public.riscatti (
  id              uuid primary key default gen_random_uuid(),
  tifoso_id       uuid not null references auth.users(id) on delete cascade,
  premio_id       uuid not null references public.premi(id) on delete restrict,
  punti_scalati   integer not null,
  codice          text not null unique,
  stato           text not null default 'in_attesa' check (stato in ('in_attesa', 'consegnato', 'annullato')),
  consegnato_da   uuid references auth.users(id) on delete set null,
  note            text,
  creato_il       timestamptz not null default now(),
  consegnato_il   timestamptz
);

-- ── INDICI ──
create index if not exists riscatti_tifoso_idx on public.riscatti(tifoso_id);
create index if not exists riscatti_stato_idx  on public.riscatti(stato);
create index if not exists riscatti_codice_idx on public.riscatti(codice);

-- ── RLS ──
alter table public.premi    enable row level security;
alter table public.riscatti enable row level security;

create policy "premi_lettura" on public.premi
  for select using (attivo = true);

create policy "riscatti_propri_select" on public.riscatti
  for select using (auth.uid() = tifoso_id);

create policy "riscatti_inserimento" on public.riscatti
  for insert with check (auth.uid() = tifoso_id);
