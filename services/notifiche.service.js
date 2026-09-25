// services/notifiche.service.js
// Gestisce notifiche push (OneSignal), email (Resend) e storico notifiche
import { supabaseAdmin, supabaseAs } from '../config/supabase.js'

const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID
const ONESIGNAL_REST    = process.env.ONESIGNAL_REST_KEY
const RESEND_API_KEY    = process.env.RESEND_API_KEY
const EMAIL_FROM        = process.env.EMAIL_FROM ?? 'noreply@cartavirtus.it'

// ─────────────────────────────────────────────
// INVIO NOTIFICHE
// ─────────────────────────────────────────────

/**
 * Invia notifica push via OneSignal + salva in DB.
 * Pattern identico a VolleyLive (Cloudflare Worker proxy opzionale).
 *
 * @param {string} tifoso_id
 * @param {object} notifica - { tipo, titolo, corpo, payload? }
 * @param {string} onesignal_player_id - ID dispositivo OneSignal del tifoso
 */
export async function inviaPush(tifoso_id, { tipo, titolo, corpo, payload }, onesignal_player_id) {
  // 1. Salva in DB
  await salvaNotifica(tifoso_id, { tipo, titolo, corpo, payload, canale: 'push' })

  // 2. Invia via OneSignal
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST) {
    console.warn('[notifiche] OneSignal non configurato — skip push')
    return
  }

  const body = {
    app_id: ONESIGNAL_APP_ID,
    headings:  { it: titolo, en: titolo },
    contents:  { it: corpo,  en: corpo },
    data:      payload ?? {},
    ...(onesignal_player_id
      ? { include_player_ids: [onesignal_player_id] }
      : { filters: [{ field: 'tag', key: 'tifoso_id', relation: '=', value: tifoso_id }] }
    )
  }

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST}`
      },
      body: JSON.stringify(body)
    })
    if (!res.ok) console.error('[notifiche] OneSignal error:', await res.text())
  } catch (err) {
    console.error('[notifiche] OneSignal fetch error:', err.message)
  }
}

/**
 * Invia email transazionale via Resend.
 */
export async function inviaEmail(tifoso_id, { tipo, titolo, corpo, html }) {
  await salvaNotifica(tifoso_id, { tipo, titolo, corpo, canale: 'email' })

  if (!RESEND_API_KEY) {
    console.warn('[notifiche] Resend non configurato — skip email')
    return
  }

  // Recupera email del tifoso
  const { data: tifoso } = await supabaseAdmin
    .from('tifosi')
    .select('email, nome')
    .eq('id', tifoso_id)
    .single()

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from:    EMAIL_FROM,
        to:      tifoso.email,
        subject: titolo,
        html:    html ?? `<p>${corpo}</p>`
      })
    })
  } catch (err) {
    console.error('[notifiche] Resend error:', err.message)
  }
}

// ─────────────────────────────────────────────
// NOTIFICHE EVENTO (chiamate dai servizi)
// ─────────────────────────────────────────────

/**
 * Notifica punti accumulati dopo un acquisto.
 */
export async function notificaPuntiAccumulati(tifoso_id, { punti_delta, partner_nome, saldo_nuovo }) {
  await inviaPush(tifoso_id, {
    tipo:    'punti_accumulati',
    titolo:  `+${punti_delta} punti Carta Virtus!`,
    corpo:   `Hai accumulato ${punti_delta} punti da ${partner_nome}. Saldo: ${saldo_nuovo} punti.`,
    payload: { punti_delta, partner_nome, saldo_nuovo }
  })
}

/**
 * Notifica coupon emesso dopo un riscatto.
 */
export async function notificaCouponEmesso(tifoso_id, { premio_titolo, coupon_code, scade_il }) {
  const scadenza = new Date(scade_il).toLocaleDateString('it-IT')
  await inviaPush(tifoso_id, {
    tipo:    'coupon_emesso',
    titolo:  'Il tuo coupon è pronto!',
    corpo:   `Coupon per "${premio_titolo}" emesso. Codice: ${coupon_code}. Valido fino al ${scadenza}.`,
    payload: { coupon_code, premio_titolo, scade_il }
  })
}

/**
 * Notifica quando il tifoso raggiunge una soglia di punti.
 */
export async function notificaSogliaRaggiunta(tifoso_id, { punti_saldo }) {
  // Soglie predefinite
  const soglie = [100, 250, 500, 1000, 2500, 5000]
  const soglia = soglie.find(s => punti_saldo >= s && punti_saldo - 50 < s) // appena superata

  if (!soglia) return  // nessuna soglia raggiunta

  await inviaPush(tifoso_id, {
    tipo:    'soglia_raggiunta',
    titolo:  `Hai raggiunto ${soglia} punti!`,
    corpo:   `Complimenti! Hai ${punti_saldo} punti. Vai al catalogo e scopri cosa puoi riscattare.`,
    payload: { soglia, punti_saldo }
  })
}

/**
 * Notifica promozionale ai tifosi (broadcast campagna).
 * Solo admin.
 */
export async function notificaPromozione(adminToken, { titolo, corpo, partner_id }) {
  const { data: { user } } = await supabaseAs(adminToken).auth.getUser()
  if (user.user_metadata?.ruolo !== 'admin') throw new Error('Solo admin')

  // Recupera tutti i tifosi attivi con consenso marketing
  const { data: tifosi } = await supabaseAdmin
    .from('tifosi')
    .select('id')
    .eq('stato', 'attivo')
    .eq('consenso_marketing', true)

  // Invia in batch (senza sovraccaricare OneSignal)
  const BATCH = 50
  for (let i = 0; i < tifosi.length; i += BATCH) {
    const batch = tifosi.slice(i, i + BATCH)
    await Promise.allSettled(
      batch.map(t => salvaNotifica(t.id, {
        tipo:    'promo_partner',
        titolo,
        corpo,
        canale:  'push',
        payload: { partner_id }
      }))
    )
  }

  // Broadcast OneSignal unico (più efficiente dei singoli)
  if (ONESIGNAL_APP_ID && ONESIGNAL_REST) {
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST}`
      },
      body: JSON.stringify({
        app_id:   ONESIGNAL_APP_ID,
        headings: { it: titolo },
        contents: { it: corpo },
        filters:  [{ field: 'tag', key: 'consenso_marketing', relation: '=', value: 'true' }]
      })
    })
  }

  return { inviata_a: tifosi.length }
}

// ─────────────────────────────────────────────
// LETTURA NOTIFICHE (app tifoso)
// ─────────────────────────────────────────────

/**
 * Lista notifiche del tifoso loggato.
 */
export async function getMieNotifiche(tifosoToken, { limit = 30, offset = 0, solo_non_lette } = {}) {
  const client = supabaseAs(tifosoToken)

  let query = client
    .from('notifiche')
    .select('id, tipo, titolo, corpo, payload, canale, letta, inviata_il, letta_il')
    .order('inviata_il', { ascending: false })
    .range(offset, offset + limit - 1)

  if (solo_non_lette) query = query.eq('letta', false)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

/**
 * Marca una notifica come letta.
 */
export async function marcaLetta(tifosoToken, notifica_id) {
  const client = supabaseAs(tifosoToken)

  const { data, error } = await client
    .from('notifiche')
    .update({ letta: true, letta_il: new Date().toISOString() })
    .eq('id', notifica_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Marca tutte le notifiche come lette.
 */
export async function marcaTutteLette(tifosoToken) {
  const client = supabaseAs(tifosoToken)

  const { error } = await client
    .from('notifiche')
    .update({ letta: true, letta_il: new Date().toISOString() })
    .eq('letta', false)

  if (error) throw new Error(error.message)
  return { ok: true }
}

// ─────────────────────────────────────────────
// HELPER INTERNO
// ─────────────────────────────────────────────

async function salvaNotifica(tifoso_id, { tipo, titolo, corpo, payload, canale }) {
  const { error } = await supabaseAdmin
    .from('notifiche')
    .insert({ tifoso_id, tipo, titolo, corpo, payload: payload ?? null, canale })

  if (error) console.error('[notifiche] Errore salvataggio:', error.message)
}
