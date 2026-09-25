// services/punti.service.js
// Gestisce accumulo punti, storico transazioni e saldo tifoso
import { supabaseAdmin, supabaseAs } from '../config/supabase.js'

// ─────────────────────────────────────────────
// ACCUMULO (chiamato dallo scanner del partner)
// ─────────────────────────────────────────────

/**
 * Registra un acquisto e accredita i punti al tifoso.
 * Chiama la funzione PostgreSQL accumula_punti() che gestisce
 * tutto atomicamente: QR → tifoso → campagna attiva → transazione.
 *
 * @param {string} partnerToken - JWT del partner loggato
 * @param {object} dati - { qr_code, importo_eur, note? }
 * @returns {object} transazione creata con punti_delta e moltiplicatore
 */
export async function registraAcquisto(partnerToken, { qr_code, importo_eur, note }) {
  // Ricava partner_id dal token
  const client = supabaseAs(partnerToken)
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError) throw new Error('Token partner non valido')

  const { data: partner, error: partnerError } = await supabaseAdmin
    .from('partner')
    .select('id, attivo')
    .eq('auth_user_id', user.id)
    .single()

  if (partnerError || !partner?.attivo) throw new Error('Partner non trovato o non attivo')

  // Chiama la stored function sul DB
  const { data, error } = await supabaseAdmin.rpc('accumula_punti', {
    p_tifoso_qr:   qr_code,
    p_partner_id:  partner.id,
    p_importo_eur: importo_eur,
    p_note:        note ?? null
  })

  if (error) throw new Error(`Accumulo fallito: ${error.message}`)

  return data  // transazione completa
}

/**
 * Accumulo bonus manuale — solo admin.
 * Es: bonus per aver assistito a una partita, compleanno, ecc.
 *
 * @param {string} adminToken
 * @param {object} dati - { tifoso_id, punti, motivo }
 */
export async function assegnaBonus(adminToken, { tifoso_id, punti, motivo }) {
  const { data: { user }, error } = await supabaseAs(adminToken).auth.getUser()
  if (error || user.user_metadata?.ruolo !== 'admin') {
    throw new Error('Solo gli admin possono assegnare bonus')
  }

  // Legge saldo attuale per il campo saldo_dopo
  const { data: tifoso } = await supabaseAdmin
    .from('tifosi')
    .select('punti_saldo')
    .eq('id', tifoso_id)
    .single()

  const { data, error: txError } = await supabaseAdmin
    .from('transazioni')
    .insert({
      tifoso_id,
      tipo:        'BONUS',
      punti_delta: punti,
      saldo_dopo:  tifoso.punti_saldo + punti,
      note:        motivo ?? 'Bonus manuale',
      operatore_id: user.id
    })
    .select()
    .single()

  if (txError) throw new Error(txError.message)
  return data
}

// ─────────────────────────────────────────────
// SALDO E STORICO (chiamati dall'app tifoso)
// ─────────────────────────────────────────────

/**
 * Restituisce saldo punti e riepilogo del tifoso loggato.
 * @param {string} tifosToken
 */
export async function getMioSaldo(tifosoToken) {
  const client = supabaseAs(tifosoToken)

  const { data, error } = await client
    .from('tifosi')
    .select('id, nome, cognome, punti_saldo, qr_code, stato')
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Storico transazioni del tifoso loggato.
 * @param {string} tifosoToken
 * @param {object} opzioni - { limit?, offset?, tipo? }
 */
export async function getMioStorico(tifosoToken, { limit = 20, offset = 0, tipo } = {}) {
  const client = supabaseAs(tifosoToken)

  let query = client
    .from('transazioni')
    .select(`
      id, tipo, punti_delta, importo_eur,
      moltiplicatore_applicato, note, saldo_dopo, creato_il,
      partner:partner_id ( nome_negozio, categoria ),
      campagna:campagna_id ( titolo, moltiplicatore )
    `)
    .order('creato_il', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tipo) query = query.eq('tipo', tipo)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

/**
 * Statistiche punti del tifoso: totale accumulato, riscattato, per partner.
 * @param {string} tifosoToken
 */
export async function getMieStatistiche(tifosoToken) {
  const client = supabaseAs(tifosoToken)

  // Aggregazioni via SQL — una sola query
  const { data, error } = await client.rpc('statistiche_tifoso')
  // (funzione opzionale da aggiungere al DB — vedi utils/db-extras.sql)

  // Fallback senza RPC: calcola lato JS
  if (error) {
    const { data: tx } = await client
      .from('transazioni')
      .select('tipo, punti_delta')

    const totaleAccumulato = tx
      .filter(t => ['ACCUMULO', 'BONUS'].includes(t.tipo))
      .reduce((s, t) => s + t.punti_delta, 0)

    const totaleRiscattato = tx
      .filter(t => t.tipo === 'RISCATTO')
      .reduce((s, t) => s + Math.abs(t.punti_delta), 0)

    return { totaleAccumulato, totaleRiscattato }
  }

  return data
}

// ─────────────────────────────────────────────
// ADMIN: storico di qualsiasi tifoso
// ─────────────────────────────────────────────

/**
 * Storico transazioni di un tifoso specifico — solo admin.
 */
export async function getStoricoTifoso(adminToken, tifoso_id, { limit = 50, offset = 0 } = {}) {
  const { data: { user } } = await supabaseAs(adminToken).auth.getUser()
  if (user.user_metadata?.ruolo !== 'admin') throw new Error('Non autorizzato')

  const { data, error } = await supabaseAdmin
    .from('transazioni')
    .select(`
      id, tipo, punti_delta, importo_eur, note, saldo_dopo, creato_il,
      partner:partner_id ( nome_negozio ),
      campagna:campagna_id ( titolo )
    `)
    .eq('tifoso_id', tifoso_id)
    .order('creato_il', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)
  return data
}
