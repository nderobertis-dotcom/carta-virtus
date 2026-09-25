-- ── TABELLA IMPOSTAZIONI ──
create table if not exists public.impostazioni (
  chiave  text primary key,
  valore  text not null,
  nota    text
);

alter table public.impostazioni enable row level security;

create policy "impostazioni_lettura" on public.impostazioni
  for select using (true);

create policy "impostazioni_update" on public.impostazioni
  for update using (true) with check (true);

create policy "impostazioni_insert" on public.impostazioni
  for insert with check (true);

-- Valore iniziale: 10 punti per euro
insert into public.impostazioni (chiave, valore, nota)
values ('punti_per_euro', '10', 'Punti accreditati per ogni euro versato in ricarica')
on conflict (chiave) do nothing;
