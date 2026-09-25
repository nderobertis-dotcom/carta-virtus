-- ── 1. RINOMINA PIANI ESISTENTI ──
-- Aggiorna i membership esistenti: Base→Bronze, Pro→Silver, Premium→Gold
update public.tifosi set piano_attivo = 'bronze' where piano_attivo = 'base';
update public.tifosi set piano_attivo = 'silver' where piano_attivo = 'pro';
update public.tifosi set piano_attivo = 'gold'   where piano_attivo = 'premium';

update public.membership set piano = 'bronze' where piano = 'base';
update public.membership set piano = 'silver' where piano = 'pro';
update public.membership set piano = 'gold'   where piano = 'premium';

-- ── 2. FUNZIONE PENALITÀ AUTOMATICA ──
-- Scala 5 punti ai tifosi BASE che non sono stati scansionati il giorno della gara
-- (eseguita automaticamente alle 23:59 di ogni giorno di gara casalinga)
create or replace function public.applica_penalita_base()
returns void
language plpgsql
security definer
as $$
declare
  oggi date := current_date;
  tifoso record;
  punti_attuali integer;
begin
  -- Verifica se oggi c'è una gara casalinga
  if not exists (
    select 1 from public.gare
    where data_gara::date = oggi
    and tipo = 'casalinga'
    and attiva = true
  ) then
    return; -- nessuna gara oggi, non fare nulla
  end if;

  -- Per ogni tifoso BASE attivo
  for tifoso in
    select t.id, t.auth_user_id, t.punti_saldo
    from public.tifosi t
    where t.piano_attivo = 'base'
    and t.stato = 'attivo'
  loop
    -- Verifica se è stato scansionato oggi
    if not exists (
      select 1 from public.ingressi i
      where i.tifoso_id = tifoso.auth_user_id
      and i.creato_il::date = oggi
    ) then
      -- Scala massimo fino a 0 (non va in negativo)
      punti_attuali := tifoso.punti_saldo;
      if punti_attuali > 0 then
        update public.tifosi
        set punti_saldo = greatest(0, punti_saldo - 5)
        where id = tifoso.id;

        -- Registra la transazione
        insert into public.transazioni (tifoso_id, tipo, punti_delta, nota)
        values (
          tifoso.auth_user_id,
          'PENALITA',
          -least(5, punti_attuali),
          'Penalità assenza gara casalinga - ' || oggi::text
        );
      end if;
    end if;
  end loop;
end;
$$;

-- ── 3. JOB SCHEDULATO (richiede pg_cron abilitato in Supabase) ──
-- Esegui questo separatamente SOLO se pg_cron è abilitato nel tuo progetto Supabase
-- (Dashboard → Database → Extensions → pg_cron)
--
-- select cron.schedule(
--   'penalita-tifosi-base',
--   '59 21 * * *',  -- ogni giorno alle 23:59 (UTC+2 = 21:59 UTC)
--   'select public.applica_penalita_base()'
-- );

-- ── 4. AGGIORNA CHECK CONSTRAINT SUI PIANI ──
-- Prima rimuovi il vecchio constraint se esiste
alter table public.tifosi
  drop constraint if exists tifosi_piano_attivo_check;

alter table public.tifosi
  add constraint tifosi_piano_attivo_check
  check (piano_attivo in ('base', 'bronze', 'silver', 'gold'));

alter table public.membership
  drop constraint if exists membership_piano_check;

alter table public.membership
  add constraint membership_piano_check
  check (piano in ('base', 'bronze', 'silver', 'gold'));
