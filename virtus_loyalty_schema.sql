-- ============================================================
--  VIRTUS BASKET MOLFETTA — Programma Fedeltà
--  Schema Supabase / PostgreSQL
--  Generato per: nderobertis@gmail.com
-- ============================================================

-- Estensioni necessarie
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

create type stato_tifoso as enum ('attivo', 'sospeso', 'cancellato');

create type tipo_transazione as enum (
  'ACCUMULO',    -- acquisto presso partner
  'BONUS',       -- bonus manuale (compleanno, presenza partita, ecc.)
  'RISCATTO',    -- uso punti per un premio
  'RETTIFICA',   -- correzione admin
  'SCADENZA'     -- punti scaduti
);

create type stato_riscatto as enum (
  'emesso',      -- coupon generato, non ancora usato
  'usato',       -- partner ha marcato come usato
  'scaduto',     -- coupon non usato entro la scadenza
  'annullato'    -- annullato da admin
);

create type categoria_partner as enum (
  'ristorazione',
  'abbigliamento',
  'sport',
  'salute_benessere',
  'intrattenimento',
  'servizi',
  'altro'
);

create type tipo_notifica as enum (
  'punti_accumulati',
  'soglia_raggiunta',
  'premio_disponibile',
  'coupon_emesso',
  'coupon_in_scadenza',
  'promo_partner',
  'sistema'
);


-- ============================================================
-- 2. TABELLA: tifosi
--    Utente finale del programma fedeltà.
--    Collegato a auth.users di Supabase Auth.
-- ============================================================

create table public.tifosi (
  id              uuid primary key default uuid_generate_v4(),
  auth_user_id    uuid unique references auth.users(id) on delete set null,

  nome            text not null,
  cognome         text not null,
  email           text not null unique,
  telefono        text,
  data_nascita    date,

  -- QR code univoco per identificare il tifoso nei negozi
  qr_code         text not null unique default encode(gen_random_bytes(12), 'hex'),

  -- Cache del saldo (aggiornata atomicamente con ogni transazione)
  punti_saldo     integer not null default 0 check (punti_saldo >= 0),

  stato           stato_tifoso not null default 'attivo',

  -- Consensi GDPR
  consenso_marketing  boolean not null default false,
  consenso_profiling  boolean not null default false,

  creato_il       timestamptz not null default now(),
  aggiornato_il   timestamptz not null default now()
);

comment on table public.tifosi is 'Tifosi iscritti al programma fedeltà';
comment on column public.tifosi.qr_code is 'Codice univoco per QR scanner nei negozi partner';
comment on column public.tifosi.punti_saldo is 'Cache del saldo. Fonte di verità = SUM(transazioni.punti_delta)';


-- ============================================================
-- 3. TABELLA: partner
--    Negozi e attività commerciali aderenti al programma.
-- ============================================================

create table public.partner (
  id              uuid primary key default uuid_generate_v4(),
  auth_user_id    uuid unique references auth.users(id) on delete set null,

  nome_negozio    text not null,
  categoria       categoria_partner not null default 'altro',
  descrizione     text,
  indirizzo       text,
  citta           text not null default 'Molfetta',
  logo_url        text,
  sito_web        text,

  -- Contatto referente
  referente_nome  text,
  referente_email text,
  referente_tel   text,

  -- Chiave API per lo scanner QR (hashed)
  api_key_hash    text unique,

  -- Configurazione punti: quanti punti per euro speso
  punti_per_euro  numeric(5,2) not null default 1.00,

  attivo          boolean not null default true,

  creato_il       timestamptz not null default now(),
  aggiornato_il   timestamptz not null default now()
);

comment on table public.partner is 'Negozi e attività partner del programma fedeltà';
comment on column public.partner.punti_per_euro is 'Rapporto base: N punti per ogni euro speso. Modificabile dalle campagne.';


-- ============================================================
-- 4. TABELLA: campagne
--    Promozioni a tempo con moltiplicatore punti.
-- ============================================================

create table public.campagne (
  id              uuid primary key default uuid_generate_v4(),
  partner_id      uuid references public.partner(id) on delete cascade,

  titolo          text not null,
  descrizione     text,

  -- Moltiplicatore: 2 = doppi punti, 3 = tripli, ecc.
  moltiplicatore  numeric(4,2) not null default 1.00 check (moltiplicatore >= 1),

  -- NULL su partner_id = campagna globale Virtus Basket
  -- (es. bonus punti per chi viene alla partita)

  valida_da       timestamptz not null,
  valida_fino     timestamptz not null,

  attiva          boolean not null default true,

  creato_il       timestamptz not null default now(),

  constraint campagne_date_valide check (valida_fino > valida_da)
);

comment on table public.campagne is 'Promozioni a tempo con moltiplicatore punti';
comment on column public.campagne.partner_id is 'NULL = campagna globale di Virtus Basket';


-- ============================================================
-- 5. TABELLA: transazioni
--    Ledger append-only di ogni variazione punti.
--    MAI modificare o cancellare righe — solo INSERT.
-- ============================================================

create table public.transazioni (
  id              uuid primary key default uuid_generate_v4(),
  tifoso_id       uuid not null references public.tifosi(id) on delete restrict,
  partner_id      uuid references public.partner(id) on delete set null,
  campagna_id     uuid references public.campagne(id) on delete set null,

  tipo            tipo_transazione not null,

  -- Variazione punti: positivo = accumulo, negativo = riscatto/scadenza
  punti_delta     integer not null,

  -- Importo speso (solo per tipo ACCUMULO)
  importo_eur     numeric(10,2),

  -- Punti calcolati prima del moltiplicatore campagna
  punti_base      integer,
  moltiplicatore_applicato numeric(4,2) default 1.00,

  note            text,

  -- Saldo snapshot al momento della transazione (per audit)
  saldo_dopo      integer not null,

  -- Chi ha creato la transazione
  operatore_id    uuid references auth.users(id) on delete set null,

  creato_il       timestamptz not null default now()
);

comment on table public.transazioni is 'Ledger immutabile di ogni variazione punti. Solo INSERT, mai UPDATE/DELETE.';
comment on column public.transazioni.saldo_dopo is 'Snapshot del saldo tifoso dopo questa transazione, per audit trail.';

-- Indici per query frequenti
create index idx_transazioni_tifoso on public.transazioni(tifoso_id, creato_il desc);
create index idx_transazioni_partner on public.transazioni(partner_id, creato_il desc);
create index idx_transazioni_tipo on public.transazioni(tipo);


-- ============================================================
-- 6. TABELLA: premi
--    Catalogo premi e sconti offerti dai partner.
-- ============================================================

create table public.premi (
  id              uuid primary key default uuid_generate_v4(),
  partner_id      uuid not null references public.partner(id) on delete cascade,

  titolo          text not null,
  descrizione     text,
  immagine_url    text,

  -- Costo in punti per riscattare questo premio
  costo_punti     integer not null check (costo_punti > 0),

  -- Disponibilità (NULL = illimitata)
  quantita_max    integer,
  quantita_usata  integer not null default 0,

  -- Validità del coupon dopo l'emissione (in giorni)
  validita_giorni integer not null default 30,

  attivo          boolean not null default true,

  valido_da       timestamptz default now(),
  valido_fino     timestamptz,

  creato_il       timestamptz not null default now(),
  aggiornato_il   timestamptz not null default now()
);

comment on table public.premi is 'Catalogo premi riscattabili con i punti';
comment on column public.premi.quantita_max is 'NULL = disponibilità illimitata';
comment on column public.premi.validita_giorni is 'Giorni di validità del coupon dopo l emissione';

-- Vista per premi disponibili (filtra quelli esauriti o scaduti)
create view public.premi_disponibili as
  select *
  from public.premi
  where attivo = true
    and (valido_fino is null or valido_fino > now())
    and (quantita_max is null or quantita_usata < quantita_max);


-- ============================================================
-- 7. TABELLA: riscatti
--    Ogni singolo riscatto di un premio da parte di un tifoso.
-- ============================================================

create table public.riscatti (
  id              uuid primary key default uuid_generate_v4(),
  tifoso_id       uuid not null references public.tifosi(id) on delete restrict,
  premio_id       uuid not null references public.premi(id) on delete restrict,
  transazione_id  uuid not null references public.transazioni(id) on delete restrict,

  -- Coupon univoco mostrato al partner per validare
  coupon_code     text not null unique default upper(encode(gen_random_bytes(6), 'hex')),

  stato           stato_riscatto not null default 'emesso',
  punti_usati     integer not null,

  -- Partner che ha marcato il coupon come usato
  usato_da_partner_id uuid references public.partner(id) on delete set null,

  emesso_il       timestamptz not null default now(),
  scade_il        timestamptz not null,
  usato_il        timestamptz,
  aggiornato_il   timestamptz not null default now()
);

comment on table public.riscatti is 'Ogni riscatto di un premio. Collegato alla transazione di detrazione punti.';
comment on column public.riscatti.coupon_code is 'Codice alfanumerico mostrato al partner per validare il premio';

create index idx_riscatti_tifoso on public.riscatti(tifoso_id, emesso_il desc);
create index idx_riscatti_coupon on public.riscatti(coupon_code);
create index idx_riscatti_stato on public.riscatti(stato);


-- ============================================================
-- 8. TABELLA: notifiche
--    Storico notifiche push/email inviate ai tifosi.
-- ============================================================

create table public.notifiche (
  id              uuid primary key default uuid_generate_v4(),
  tifoso_id       uuid not null references public.tifosi(id) on delete cascade,

  tipo            tipo_notifica not null,
  titolo          text not null,
  corpo           text,
  payload         jsonb,   -- dati aggiuntivi (es. id_premio, punti, ecc.)

  canale          text not null default 'push', -- 'push', 'email', 'sms'
  letta           boolean not null default false,

  inviata_il      timestamptz not null default now(),
  letta_il        timestamptz
);

create index idx_notifiche_tifoso on public.notifiche(tifoso_id, inviata_il desc);
create index idx_notifiche_non_lette on public.notifiche(tifoso_id) where letta = false;


-- ============================================================
-- 9. FUNZIONE: aggiorna_saldo_tifoso()
--    Trigger che mantiene sincronizzato punti_saldo
--    dopo ogni INSERT in transazioni.
-- ============================================================

create or replace function public.aggiorna_saldo_tifoso()
returns trigger language plpgsql security definer as $$
begin
  update public.tifosi
  set
    punti_saldo   = punti_saldo + NEW.punti_delta,
    aggiornato_il = now()
  where id = NEW.tifoso_id;

  return NEW;
end;
$$;

create trigger trg_aggiorna_saldo
  after insert on public.transazioni
  for each row execute function public.aggiorna_saldo_tifoso();


-- ============================================================
-- 10. FUNZIONE: riscatta_premio()
--     Operazione atomica: controlla saldo, detrae punti,
--     crea transazione e riscatto in un'unica transazione.
-- ============================================================

create or replace function public.riscatta_premio(
  p_tifoso_id   uuid,
  p_premio_id   uuid
)
returns public.riscatti language plpgsql security definer as $$
declare
  v_premio      public.premi;
  v_tifoso      public.tifosi;
  v_transazione public.transazioni;
  v_riscatto    public.riscatti;
  v_scade_il    timestamptz;
begin
  -- Lock sul tifoso per evitare race condition
  select * into v_tifoso
  from public.tifosi
  where id = p_tifoso_id
  for update;

  -- Lock sul premio per aggiornare quantita_usata
  select * into v_premio
  from public.premi
  where id = p_premio_id and attivo = true
  for update;

  -- Validazioni
  if v_tifoso.id is null then
    raise exception 'Tifoso non trovato';
  end if;

  if v_premio.id is null then
    raise exception 'Premio non disponibile';
  end if;

  if v_tifoso.punti_saldo < v_premio.costo_punti then
    raise exception 'Saldo insufficiente: hai % punti, servono %',
      v_tifoso.punti_saldo, v_premio.costo_punti;
  end if;

  if v_premio.quantita_max is not null
     and v_premio.quantita_usata >= v_premio.quantita_max then
    raise exception 'Premio esaurito';
  end if;

  v_scade_il := now() + (v_premio.validita_giorni || ' days')::interval;

  -- Crea transazione di detrazione
  insert into public.transazioni (
    tifoso_id, partner_id, tipo, punti_delta, saldo_dopo, note
  )
  values (
    p_tifoso_id,
    v_premio.partner_id,
    'RISCATTO',
    -v_premio.costo_punti,
    v_tifoso.punti_saldo - v_premio.costo_punti,
    'Riscatto premio: ' || v_premio.titolo
  )
  returning * into v_transazione;

  -- Crea riscatto
  insert into public.riscatti (
    tifoso_id, premio_id, transazione_id,
    punti_usati, scade_il
  )
  values (
    p_tifoso_id, p_premio_id, v_transazione.id,
    v_premio.costo_punti, v_scade_il
  )
  returning * into v_riscatto;

  -- Incrementa contatore utilizzi sul premio
  update public.premi
  set quantita_usata = quantita_usata + 1,
      aggiornato_il  = now()
  where id = p_premio_id;

  return v_riscatto;
end;
$$;

comment on function public.riscatta_premio is
  'Riscatto atomico: controlla saldo, detrae punti, crea transazione e coupon. Usa FOR UPDATE per evitare race condition.';


-- ============================================================
-- 11. FUNZIONE: accumula_punti()
--     Chiamata dallo scanner del partner.
--     Calcola moltiplicatore campagna attiva e crea transazione.
-- ============================================================

create or replace function public.accumula_punti(
  p_tifoso_qr     text,
  p_partner_id    uuid,
  p_importo_eur   numeric,
  p_note          text default null
)
returns public.transazioni language plpgsql security definer as $$
declare
  v_tifoso        public.tifosi;
  v_partner       public.partner;
  v_campagna      public.campagne;
  v_moltiplicatore numeric := 1.00;
  v_punti_base    integer;
  v_punti_totali  integer;
  v_transazione   public.transazioni;
begin
  -- Trova tifoso dal QR
  select * into v_tifoso
  from public.tifosi
  where qr_code = p_tifoso_qr and stato = 'attivo';

  if v_tifoso.id is null then
    raise exception 'QR code non valido o tifoso sospeso';
  end if;

  -- Trova partner
  select * into v_partner
  from public.partner
  where id = p_partner_id and attivo = true;

  if v_partner.id is null then
    raise exception 'Partner non attivo';
  end if;

  -- Cerca campagna attiva per questo partner
  select * into v_campagna
  from public.campagne
  where (partner_id = p_partner_id or partner_id is null)
    and attiva = true
    and now() between valida_da and valida_fino
  order by moltiplicatore desc
  limit 1;

  if v_campagna.id is not null then
    v_moltiplicatore := v_campagna.moltiplicatore;
  end if;

  -- Calcola punti
  v_punti_base   := floor(p_importo_eur * v_partner.punti_per_euro);
  v_punti_totali := floor(v_punti_base * v_moltiplicatore);

  if v_punti_totali <= 0 then
    raise exception 'Importo troppo basso per generare punti';
  end if;

  -- Crea transazione
  insert into public.transazioni (
    tifoso_id, partner_id, campagna_id, tipo,
    punti_delta, importo_eur,
    punti_base, moltiplicatore_applicato,
    saldo_dopo, note
  )
  values (
    v_tifoso.id, p_partner_id, v_campagna.id, 'ACCUMULO',
    v_punti_totali, p_importo_eur,
    v_punti_base, v_moltiplicatore,
    v_tifoso.punti_saldo + v_punti_totali,
    p_note
  )
  returning * into v_transazione;

  return v_transazione;
end;
$$;

comment on function public.accumula_punti is
  'Registra un acquisto: legge il QR del tifoso, applica eventuale campagna attiva, crea la transazione punti.';


-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Abilita RLS su tutte le tabelle
alter table public.tifosi       enable row level security;
alter table public.partner      enable row level security;
alter table public.campagne     enable row level security;
alter table public.transazioni  enable row level security;
alter table public.premi        enable row level security;
alter table public.riscatti     enable row level security;
alter table public.notifiche    enable row level security;

-- TIFOSI: ogni tifoso vede solo se stesso
create policy "tifoso_vede_se_stesso"
  on public.tifosi for select
  using (auth_user_id = auth.uid());

create policy "tifoso_aggiorna_se_stesso"
  on public.tifosi for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- TRANSAZIONI: il tifoso vede solo le sue
create policy "tifoso_vede_sue_transazioni"
  on public.transazioni for select
  using (tifoso_id = (
    select id from public.tifosi where auth_user_id = auth.uid()
  ));

-- RISCATTI: il tifoso vede solo i suoi
create policy "tifoso_vede_suoi_riscatti"
  on public.riscatti for select
  using (tifoso_id = (
    select id from public.tifosi where auth_user_id = auth.uid()
  ));

-- PREMI: tutti i loggati vedono il catalogo
create policy "premi_pubblici_per_loggati"
  on public.premi for select
  using (auth.uid() is not null and attivo = true);

-- PARTNER: tutti i loggati vedono i partner attivi
create policy "partner_pubblici_per_loggati"
  on public.partner for select
  using (auth.uid() is not null and attivo = true);

-- CAMPAGNE: tutti i loggati vedono le campagne attive
create policy "campagne_pubbliche_per_loggati"
  on public.campagne for select
  using (auth.uid() is not null and attiva = true);

-- NOTIFICHE: ogni tifoso vede solo le sue
create policy "tifoso_vede_sue_notifiche"
  on public.notifiche for select
  using (tifoso_id = (
    select id from public.tifosi where auth_user_id = auth.uid()
  ));

create policy "tifoso_marca_notifica_letta"
  on public.notifiche for update
  using (tifoso_id = (
    select id from public.tifosi where auth_user_id = auth.uid()
  ));


-- ============================================================
-- 13. TIMESTAMP AUTO-UPDATE TRIGGER
-- ============================================================

create or replace function public.set_aggiornato_il()
returns trigger language plpgsql as $$
begin
  NEW.aggiornato_il := now();
  return NEW;
end;
$$;

create trigger trg_tifosi_ts
  before update on public.tifosi
  for each row execute function public.set_aggiornato_il();

create trigger trg_partner_ts
  before update on public.partner
  for each row execute function public.set_aggiornato_il();

create trigger trg_premi_ts
  before update on public.premi
  for each row execute function public.set_aggiornato_il();

create trigger trg_riscatti_ts
  before update on public.riscatti
  for each row execute function public.set_aggiornato_il();


-- ============================================================
-- 14. DATI DI ESEMPIO (commentati — decommentare per il seed)
-- ============================================================

/*
insert into public.partner (nome_negozio, categoria, indirizzo, punti_per_euro, referente_nome, referente_email)
values
  ('Bar dello Sport', 'ristorazione', 'Via Roma 12, Molfetta', 1.00, 'Mario Rossi', 'mario@bardelosport.it'),
  ('Ottica Centrale',  'servizi',      'Corso Dante 5, Molfetta', 2.00, 'Lucia Bianchi', 'lucia@otticacentrale.it'),
  ('Palestra FitLab',  'sport',        'Via Mare 33, Molfetta', 1.50, 'Giovanni Verdi', 'info@fitlab.it');

insert into public.premi (partner_id, titolo, descrizione, costo_punti, quantita_max, validita_giorni)
select
  id,
  'Caffè gratis',
  'Un caffè offerto dalla casa',
  50,
  100,
  30
from public.partner where nome_negozio = 'Bar dello Sport';
*/


-- ============================================================
-- FIN.
-- Eseguire intero script nell'SQL Editor di Supabase.
-- Verifica: Database > Tables deve mostrare 7 tabelle.
-- ============================================================
