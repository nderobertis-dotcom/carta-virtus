// services/premi.service.js
// Gestisce catalogo premi, riscatti e validazione coupon
import { supabaseAdmin, supabaseAs } from '../config/supabase.js'

// ─────────────────────────────────────────────
// CATALOGO (pubblico per tifosi autenticati)
// ─────────────────────────────────────────────

/**
 * Lista premi disponibili (usa la view premi_disponibili).
 * @param {string} tifosoToken
 * @param {object} filtri - { partner_id?, costo_max?, limit?, offset? }
 */
export async function getCatalogo(tifosoToken, { partner_id, costo_max, limit = 20, offset = 0 } = {}) {
  const client = supabaseAs(tifosoToken)

  let query = client
    .from('premi_disponibili')
    .select(`
      id, titolo, descrizione, immagine_url,
      costo_punti, quantita_max, quantita_usata,
      validita_giorni, valido_fino,
      partner:partner_id ( id, nome_negozio, categoria, indirizzo, logo_url )
    `)
    .order('costo_punti', { ascending: true })
    .range(offset, offset + limit - 1)

  if (partner_id) query = query.eq('partner_id', partner_id)
  if (costo_max)  query = query.lte('costo_punti', costo_max)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

/**
 * Dettaglio singolo premio.
 */
export async function getPremio(tifosoToken, premio_id) {
  const client = supabaseAs(tifosoToken)

  const { data, error } = await client
    .from('premi')
    .select(`
      *,
      partner:partner_id ( nome_negozio, indirizzo, logo_url )
    `)
    .eq('id', premio_id)
    .eq('attivo', true)
    .single()

  if (error) throw new Error(`Premio non trovato: ${error.message}`)
  return data
}

// ─────────────────────────────────────────────
// RISCATTO (tifoso)
// ─────────────────────────────────────────────

/**
 * Riscatta un premio.
 * Chiama la stored function riscatta_premio() che esegue tutto
 * atomicamente con FOR UPDATE per evitare race condition.
 *
 * @param {string} tifosoToken
 * @param {string} premio_id
 * @returns {object} riscatto con coupon_code e scade_il
 */
export async function riscattaPremio(tifosoToken, premio_id) {
  const client = supabaseAs(tifosoToken)

  // Ricava tifoso_id dal token
  const { data: tifoso, error: tifErr } = await client
    .from('tifosi')
    .select('id, punti_saldo')
    .single()

  if (tifErr) throw new Error('Profilo tifoso non trovato')

  // Chiama la stored function (atomica e sicura)
  const { data, error } = await supabaseAdmin.rpc('riscatta_premio', {
    p_tifoso_id: tifoso.id,
    p_premio_id: premio_id
  })

  if (error) throw new Error(`Riscatto fallito: ${error.message}`)

  // Arricchisce la risposta col dettaglio del premio
  const { data: premioInfo } = await supabaseAdmin
    .from('premi')
    .select('titolo, partner:partner_id(nome_negozio, indirizzo)')
    .eq('id', premio_id)
    .single()

  return { ...data, premio: premioInfo }
}

/**
 * Lista riscatti del tifoso loggato.
 * @param {string} tifosoToken
 * @param {object} opzioni - { stato?, limit?, offset? }
 */
export async function getMieiRiscatti(tifosoToken, { stato, limit = 20, offset = 0 } = {}) {
  const client = supabaseAs(tifosoToken)

  let query = client
    .from('riscatti')
    .select(`
      id, coupon_code, stato, punti_usati,
      emesso_il, scade_il, usato_il,
      premio:premio_id ( titolo, immagine_url,
        partner:partner_id ( nome_negozio, indirizzo )
      )
    `)
    .order('emesso_il', { ascending: false })
    .range(offset, offset + limit - 1)

  if (stato) query = query.eq('stato', stato)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

// ─────────────────────────────────────────────
// VALIDAZIONE COUPON (partner)
// ─────────────────────────────────────────────

/**
 * Verifica un coupon mostrato dal tifoso.
 * Restituisce i dettagli senza ancora marcarlo come usato.
 *
 * @param {string} partnerToken
 * @param {string} coupon_code
 */
export async function verificaCoupon(partnerToken, coupon_code) {
  const client = supabaseAs(partnerToken)
  const { data: { user } } = await client.auth.getUser()

  const { data: partner } = await supabaseAdmin
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const { data, error } = await supabaseAdmin
    .from('riscatti')
    .select(`
      id, stato, punti_usati, emesso_il, scade_il,
      tifoso:tifoso_id ( nome, cognome ),
      premio:premio_id (
        titolo, descrizione,
        partner:partner_id ( id, nome_negozio )
      )
    `)
    .eq('coupon_code', coupon_code.toUpperCase())
    .single()

  if (error) throw new Error('Coupon non trovato')

  // Verifica che il coupon sia di questo partner
  if (data.premio.partner.id !== partner.id) {
    throw new Error('Questo coupon non appartiene al tuo negozio')
  }

  if (data.stato !== 'emesso') {
    throw new Error(`Coupon non utilizzabile: stato "${data.stato}"`)
  }

  if (new Date(data.scade_il) < new Date()) {
    throw new Error('Coupon scaduto')
  }

  return { valido: true, riscatto: data }
}

/**
 * Marca un coupon come usato (partner).
 * @param {string} partnerToken
 * @param {string} coupon_code
 */
export async function usaCoupon(partnerToken, coupon_code) {
  // Prima verifica validità
  const { riscatto } = await verificaCoupon(partnerToken, coupon_code)

  const { data: { user } } = await supabaseAs(partnerToken).auth.getUser()
  const { data: partner } = await supabaseAdmin
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const { data, error } = await supabaseAdmin
    .from('riscatti')
    .update({
      stato:               'usato',
      usato_il:            new Date().toISOString(),
      usato_da_partner_id: partner.id
    })
    .eq('id', riscatto.id)
    .select()
    .single()

  if (error) throw new Error(`Errore marcatura coupon: ${error.message}`)
  return data
}

// ─────────────────────────────────────────────
// GESTIONE PREMI (admin)
// ─────────────────────────────────────────────

/**
 * Crea un nuovo premio nel catalogo — solo admin o partner.
 */
export async function creaPremio(token, {
  partner_id, titolo, descrizione, immagine_url,
  costo_punti, quantita_max, validita_giorni = 30,
  valido_da, valido_fino
}) {
  const { data: { user } } = await supabaseAs(token).auth.getUser()
  const ruolo = user.user_metadata?.ruolo

  // Il partner può creare solo premi per se stesso
  if (ruolo === 'partner') {
    const { data: partner } = await supabaseAdmin
      .from('partner').select('id').eq('auth_user_id', user.id).single()
    if (partner.id !== partner_id) throw new Error('Non puoi creare premi per altri partner')
  } else if (ruolo !== 'admin') {
    throw new Error('Non autorizzato')
  }

  const { data, error } = await supabaseAdmin
    .from('premi')
    .insert({
      partner_id, titolo, descrizione, immagine_url,
      costo_punti, quantita_max, validita_giorni,
      valido_da: valido_da ?? new Date().toISOString(),
      valido_fino: valido_fino ?? null
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Scade automaticamente i coupon emessi non usati.
 * Da chiamare con un cron job giornaliero.
 */
export async function scadeCouponScaduti() {
  const { data, error } = await supabaseAdmin
    .from('riscatti')
    .update({ stato: 'scaduto' })
    .eq('stato', 'emesso')
    .lt('scade_il', new Date().toISOString())
    .select('id')

  if (error) throw new Error(error.message)
  console.log(`[cron] Scaduti ${data.length} coupon`)
  return data.length
}
