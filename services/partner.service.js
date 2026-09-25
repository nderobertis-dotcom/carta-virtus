// services/partner.service.js
// Gestisce negozi partner, campagne promozionali e report
import { supabaseAdmin, supabaseAs } from '../config/supabase.js'

// ─────────────────────────────────────────────
// PARTNER (directory pubblica)
// ─────────────────────────────────────────────

/**
 * Lista partner attivi — visibile a tutti i tifosi autenticati.
 * @param {string} token
 * @param {object} filtri - { categoria?, citta?, limit?, offset? }
 */
export async function getPartner(token, { categoria, citta, limit = 50, offset = 0 } = {}) {
  const client = supabaseAs(token)

  let query = client
    .from('partner')
    .select('id, nome_negozio, categoria, descrizione, indirizzo, citta, logo_url, sito_web, punti_per_euro')
    .order('nome_negozio')
    .range(offset, offset + limit - 1)

  if (categoria) query = query.eq('categoria', categoria)
  if (citta)     query = query.ilike('citta', `%${citta}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

/**
 * Dettaglio partner con premi attivi.
 */
export async function getDettaglioPartner(token, partner_id) {
  const client = supabaseAs(token)

  const { data, error } = await client
    .from('partner')
    .select(`
      id, nome_negozio, categoria, descrizione,
      indirizzo, citta, logo_url, sito_web, punti_per_euro,
      premi ( id, titolo, descrizione, costo_punti, immagine_url,
               quantita_max, quantita_usata, valido_fino )
    `)
    .eq('id', partner_id)
    .eq('premi.attivo', true)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ─────────────────────────────────────────────
// PROFILO PARTNER (per il partner loggato)
// ─────────────────────────────────────────────

/**
 * Profilo del partner loggato con statistiche.
 */
export async function getMioProfilo(partnerToken) {
  const client = supabaseAs(partnerToken)
  const { data: { user } } = await client.auth.getUser()

  const { data, error } = await supabaseAdmin
    .from('partner')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Aggiorna dati del profilo partner (il partner può modificare solo i suoi).
 */
export async function aggiornaMioProfilo(partnerToken, campi) {
  const client = supabaseAs(partnerToken)
  const { data: { user } } = await client.auth.getUser()

  const campiConsentiti = ['descrizione', 'logo_url', 'sito_web',
                           'referente_nome', 'referente_tel']
  const payload = {}
  for (const k of campiConsentiti) {
    if (campi[k] !== undefined) payload[k] = campi[k]
  }

  const { data, error } = await supabaseAdmin
    .from('partner')
    .update(payload)
    .eq('auth_user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ─────────────────────────────────────────────
// CAMPAGNE
// ─────────────────────────────────────────────

/**
 * Lista campagne attive — visibile ai tifosi.
 */
export async function getCampagneAttive(token) {
  const client = supabaseAs(token)
  const now = new Date().toISOString()

  const { data, error } = await client
    .from('campagne')
    .select(`
      id, titolo, descrizione, moltiplicatore,
      valida_da, valida_fino,
      partner:partner_id ( nome_negozio, logo_url )
    `)
    .eq('attiva', true)
    .lte('valida_da', now)
    .gte('valida_fino', now)
    .order('moltiplicatore', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

/**
 * Crea una campagna (partner per se stesso, admin per tutti).
 */
export async function creaCampagna(token, {
  titolo, descrizione, moltiplicatore,
  valida_da, valida_fino, partner_id
}) {
  const { data: { user } } = await supabaseAs(token).auth.getUser()
  const ruolo = user.user_metadata?.ruolo

  let pid = partner_id

  if (ruolo === 'partner') {
    // Il partner può creare campagne solo per se stesso
    const { data: p } = await supabaseAdmin
      .from('partner').select('id').eq('auth_user_id', user.id).single()
    pid = p.id
  } else if (ruolo !== 'admin') {
    throw new Error('Non autorizzato')
  }

  const { data, error } = await supabaseAdmin
    .from('campagne')
    .insert({
      partner_id:   pid ?? null,  // null = campagna globale Virtus
      titolo, descrizione,
      moltiplicatore: moltiplicatore ?? 2,
      valida_da, valida_fino,
      attiva: true
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Disattiva una campagna.
 */
export async function disattivaCampagna(token, campagna_id) {
  const { data: { user } } = await supabaseAs(token).auth.getUser()
  const ruolo = user.user_metadata?.ruolo

  if (!['admin', 'partner'].includes(ruolo)) throw new Error('Non autorizzato')

  const { data, error } = await supabaseAdmin
    .from('campagne')
    .update({ attiva: false })
    .eq('id', campagna_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ─────────────────────────────────────────────
// REPORT PARTNER
// ─────────────────────────────────────────────

/**
 * Report transazioni del partner loggato.
 * Mostra quanti punti ha generato, quanti tifosi ha servito, volume €.
 *
 * @param {string} partnerToken
 * @param {object} periodo - { da: ISO string, a: ISO string }
 */
export async function getMioReport(partnerToken, { da, a } = {}) {
  const client = supabaseAs(partnerToken)
  const { data: { user } } = await client.auth.getUser()

  const { data: partner } = await supabaseAdmin
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  let query = supabaseAdmin
    .from('transazioni')
    .select('id, punti_delta, importo_eur, creato_il, tifoso_id, tipo')
    .eq('partner_id', partner.id)
    .eq('tipo', 'ACCUMULO')
    .order('creato_il', { ascending: false })

  if (da) query = query.gte('creato_il', da)
  if (a)  query = query.lte('creato_il', a)

  const { data: transazioni, error } = await query
  if (error) throw new Error(error.message)

  // Aggrega lato JS
  const tifosi_unici = new Set(transazioni.map(t => t.tifoso_id)).size
  const volume_eur   = transazioni.reduce((s, t) => s + (t.importo_eur ?? 0), 0)
  const punti_emessi = transazioni.reduce((s, t) => s + t.punti_delta, 0)

  // Coupon riscattati e usati presso questo partner
  const { data: coupon } = await supabaseAdmin
    .from('riscatti')
    .select('id, stato')
    .eq('usato_da_partner_id', partner.id)

  const coupon_usati = coupon?.filter(c => c.stato === 'usato').length ?? 0

  return {
    periodo: { da: da ?? 'inizio', a: a ?? 'oggi' },
    transazioni_totali: transazioni.length,
    tifosi_unici,
    volume_eur: Math.round(volume_eur * 100) / 100,
    punti_emessi,
    coupon_usati,
    dettaglio: transazioni
  }
}
