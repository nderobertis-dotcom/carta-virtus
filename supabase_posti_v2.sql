-- ── DROP E RICREA TABELLA POSTI ──
drop table if exists public.posti cascade;

create table public.posti (
  id              uuid primary key default gen_random_uuid(),
  tribuna         text not null check (tribuna in ('nord', 'sud')),
  fila            text not null,
  numero          integer not null,
  stato           text not null default 'disponibile'
                  check (stato in ('disponibile', 'occupato', 'riservato')),
  tifoso_id       uuid references auth.users(id) on delete set null,
  membership_id   uuid references public.membership(id) on delete set null,
  note_admin      text,
  aggiornato_il   timestamptz not null default now(),
  unique (tribuna, fila, numero)
);

alter table public.posti enable row level security;

create policy "posti_lettura"  on public.posti for select using (true);
create policy "posti_insert"   on public.posti for insert with check (true);
create policy "posti_update"   on public.posti for update using (true) with check (true);
create policy "posti_delete"   on public.posti for delete using (true);

-- ── TRIBUNA SUD ──
-- Fila E: 35 posti continui
insert into public.posti (tribuna, fila, numero) values
('sud','E',1),('sud','E',2),('sud','E',3),('sud','E',4),('sud','E',5),('sud','E',6),('sud','E',7),('sud','E',8),
('sud','E',9),('sud','E',10),('sud','E',11),('sud','E',12),('sud','E',13),('sud','E',14),('sud','E',15),
('sud','E',16),('sud','E',17),('sud','E',18),('sud','E',19),('sud','E',20),('sud','E',21),('sud','E',22),
('sud','E',23),('sud','E',24),('sud','E',25),('sud','E',26),('sud','E',27),('sud','E',28),('sud','E',29),
('sud','E',30),('sud','E',31),('sud','E',32),('sud','E',33),('sud','E',34),('sud','E',35);

-- File A-D: 29 posti (scalini a 9-10-11, 22-23-24, 33)
insert into public.posti (tribuna, fila, numero) values
('sud','D',1),('sud','D',2),('sud','D',3),('sud','D',4),('sud','D',5),('sud','D',6),('sud','D',7),('sud','D',8),
('sud','D',12),('sud','D',13),('sud','D',14),('sud','D',15),('sud','D',16),('sud','D',17),('sud','D',18),
('sud','D',19),('sud','D',20),('sud','D',21),('sud','D',25),('sud','D',26),('sud','D',27),('sud','D',28),
('sud','D',29),('sud','D',30),('sud','D',31),('sud','D',32),('sud','D',33),('sud','D',34),('sud','D',35),
('sud','C',1),('sud','C',2),('sud','C',3),('sud','C',4),('sud','C',5),('sud','C',6),('sud','C',7),('sud','C',8),
('sud','C',12),('sud','C',13),('sud','C',14),('sud','C',15),('sud','C',16),('sud','C',17),('sud','C',18),
('sud','C',19),('sud','C',20),('sud','C',21),('sud','C',25),('sud','C',26),('sud','C',27),('sud','C',28),
('sud','C',29),('sud','C',30),('sud','C',31),('sud','C',32),('sud','C',33),('sud','C',34),('sud','C',35),
('sud','B',1),('sud','B',2),('sud','B',3),('sud','B',4),('sud','B',5),('sud','B',6),('sud','B',7),('sud','B',8),
('sud','B',12),('sud','B',13),('sud','B',14),('sud','B',15),('sud','B',16),('sud','B',17),('sud','B',18),
('sud','B',19),('sud','B',20),('sud','B',21),('sud','B',25),('sud','B',26),('sud','B',27),('sud','B',28),
('sud','B',29),('sud','B',30),('sud','B',31),('sud','B',32),('sud','B',33),('sud','B',34),('sud','B',35),
('sud','A',1),('sud','A',2),('sud','A',3),('sud','A',4),('sud','A',5),('sud','A',6),('sud','A',7),('sud','A',8),
('sud','A',12),('sud','A',13),('sud','A',14),('sud','A',15),('sud','A',16),('sud','A',17),('sud','A',18),
('sud','A',19),('sud','A',20),('sud','A',21),('sud','A',25),('sud','A',26),('sud','A',27),('sud','A',28),
('sud','A',29),('sud','A',30),('sud','A',31),('sud','A',32),('sud','A',33),('sud','A',34),('sud','A',35);

-- ── TRIBUNA NORD ──
-- Fila L: 25 posti (scalini a posizione 4-5-6 e 25-26-27 nella sequenza)
insert into public.posti (tribuna, fila, numero) values
('nord','L',1),('nord','L',2),('nord','L',3),
('nord','L',4),('nord','L',5),('nord','L',6),('nord','L',7),('nord','L',8),('nord','L',9),('nord','L',10),
('nord','L',11),('nord','L',12),('nord','L',13),('nord','L',14),('nord','L',15),('nord','L',16),('nord','L',17),
('nord','L',18),('nord','L',19),('nord','L',20),('nord','L',21),
('nord','L',22),('nord','L',23),('nord','L',24),('nord','L',25);

-- File F-G-H-I: 22 posti (scalini a 4-5-6, 11-12-13, 22-23-24)
insert into public.posti (tribuna, fila, numero) values
('nord','I',1),('nord','I',2),('nord','I',3),
('nord','I',4),('nord','I',5),('nord','I',6),('nord','I',7),('nord','I',8),('nord','I',9),('nord','I',10),
('nord','I',14),('nord','I',15),('nord','I',16),('nord','I',17),('nord','I',18),('nord','I',19),('nord','I',20),('nord','I',21),
('nord','I',22),('nord','I',23),('nord','I',24),('nord','I',25),
('nord','H',1),('nord','H',2),('nord','H',3),
('nord','H',4),('nord','H',5),('nord','H',6),('nord','H',7),('nord','H',8),('nord','H',9),('nord','H',10),
('nord','H',14),('nord','H',15),('nord','H',16),('nord','H',17),('nord','H',18),('nord','H',19),('nord','H',20),('nord','H',21),
('nord','H',22),('nord','H',23),('nord','H',24),('nord','H',25),
('nord','G',1),('nord','G',2),('nord','G',3),
('nord','G',4),('nord','G',5),('nord','G',6),('nord','G',7),('nord','G',8),('nord','G',9),('nord','G',10),
('nord','G',14),('nord','G',15),('nord','G',16),('nord','G',17),('nord','G',18),('nord','G',19),('nord','G',20),('nord','G',21),
('nord','G',22),('nord','G',23),('nord','G',24),('nord','G',25),
('nord','F',1),('nord','F',2),('nord','F',3),
('nord','F',4),('nord','F',5),('nord','F',6),('nord','F',7),('nord','F',8),('nord','F',9),('nord','F',10),
('nord','F',14),('nord','F',15),('nord','F',16),('nord','F',17),('nord','F',18),('nord','F',19),('nord','F',20),('nord','F',21),
('nord','F',22),('nord','F',23),('nord','F',24),('nord','F',25)
on conflict (tribuna, fila, numero) do nothing;

-- Verifica conteggio
select tribuna, count(*) as posti from public.posti group by tribuna;
