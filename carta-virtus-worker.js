const SUPABASE_URL = 'https://brwkwlyxkptzmkzkvava.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyd2t3bHl4a3B0em1remt2YXZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUzMTc1MCwiZXhwIjoyMDk0MTA3NzUwfQ.Pb61V8euQwLt1KR-m29nr_s0F13gRXSToRiPPL6bLSQ'
const STRIPE_SECRET = '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'
const STRIPE_WEBHOOK_SECRET = 'whsec_aArvecoVPkKFvDcpAsoCFtGfZThax6L4'
const PAYPAL_CLIENT_ID = 'AXmqt2tfdCpl1F1latg1zMn8VcujvcKq0vic3955bSf2q7yvN47UJbavPs5ajAQWQFFwvetBnT_XII3Z'
const PAYPAL_CLIENT_SECRET = 'EPpjPxVKblXAIECjUKOX7ghtE0VKO6cbsyXZhwKG5qqiNUOQ8iiBQCTuQqMOiFLXpTlRbFAXEGIzJ9Vf'
const PAYPAL_API = 'https://api-m.paypal.com'
const ALLOWED_ORIGIN = '*'

const PRICE_TO_PIANO = {
  'price_1ThTPoLDT200AU24yLlcnysn': 'Base',
  'price_1ThTT6LDT200AU24BzLW2pLH': 'Bronze',
  'price_1ThTV2LDT200AU24G2pTenCB': 'Silver',
  'price_1ThTWiLDT200AU24L9Al5JfV': 'Gold',
}
const PRICE_TO_PUNTI = {
  'price_1ThTPoLDT200AU24yLlcnysn': 10,
  'price_1ThTT6LDT200AU24BzLW2pLH': 30,
  'price_1ThTV2LDT200AU24G2pTenCB': 50,
  'price_1ThTWiLDT200AU24L9Al5JfV': 100,
}
const PIANO_TO_PREZZO = { 'Base': '10.00', 'Bronze': '30.00', 'Silver': '50.00', 'Gold': '100.00' }

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
  }
}
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  })
}

// ── STRIPE HELPERS ──
async function stripeRequest(endpoint, method, data) {
  const resp = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method,
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data ? new URLSearchParams(data).toString() : null
  })
  return resp.json()
}

// ── PAYPAL HELPERS ──
async function paypalToken() {
  const resp = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(PAYPAL_CLIENT_ID + ':' + PAYPAL_CLIENT_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  const data = await resp.json()
  return data.access_token
}

async function paypalRequest(endpoint, method, data, token) {
  const resp = await fetch(`${PAYPAL_API}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : null
  })
  return resp.json()
}

// ── SUPABASE HELPERS ──
async function supabaseQuery(path, method, data) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Prefer': 'return=representation',
    },
    body: data ? JSON.stringify(data) : null
  })
  return resp.json()
}

// ── STRIPE CHECKOUT ──
async function createCheckout(body) {
  const { priceId, userId, email, tipoAcquisto, punti, importo } = body
  const params = {
    'payment_method_types[]': 'card',
    'mode': 'payment',
    'customer_email': email,
    'success_url': 'https://virtusfanmolfetta.com?payment=success',
    'cancel_url': 'https://virtusfanmolfetta.com?payment=cancel',
    'metadata[tipo]': tipoAcquisto,
  }
  if (tipoAcquisto === 'membership') {
    params['line_items[0][price]'] = priceId
    params['line_items[0][quantity]'] = '1'
    params['metadata[price_id]'] = priceId
    if (body.pendingId) params['metadata[pending_id]'] = body.pendingId
  } else {
    params['metadata[user_id]'] = userId
    params['line_items[0][price_data][currency]'] = 'eur'
    params['line_items[0][price_data][product_data][name]'] = `Ricarica ${punti} punti`
    params['line_items[0][price_data][unit_amount]'] = String(Math.round(importo * 100))
    params['line_items[0][quantity]'] = '1'
    params['metadata[punti]'] = String(punti)
    params['metadata[importo]'] = String(importo)
  }
  const session = await stripeRequest('checkout/sessions', 'POST', params)
  if (session.error) return jsonResponse({ error: session.error.message }, 400)
  return jsonResponse({ url: session.url, sessionId: session.id })
}

// ── PAYPAL: CREA ORDINE ──
async function createPaypalOrder(body) {
  const { userId, email, tipoAcquisto, pianoNome, punti, importo, magliaData, postoData } = body
  const token = await paypalToken()
  let amount, description, customId
  if (tipoAcquisto === 'membership') {
    amount = PIANO_TO_PREZZO[pianoNome] || '10.00'
    description = `Virtus Fan Card ${pianoNome} - Stagione 2026/2027`
    customId = JSON.stringify({ tipo: 'membership', user_id: userId, piano: pianoNome, maglia: magliaData || null, posto: postoData || null })
  } else {
    amount = parseFloat(importo).toFixed(2)
    description = `Ricarica ${punti} punti Virtus Fan Card`
    customId = JSON.stringify({ tipo: 'ricarica', user_id: userId, punti, importo })
  }
  const order = await paypalRequest('/v2/checkout/orders', 'POST', {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: { currency_code: 'EUR', value: amount },
      description,
      custom_id: customId
    }],
    application_context: {
      brand_name: 'Virtus Fan Card',
      locale: 'it-IT',
      return_url: 'https://virtusfanmolfetta.com?payment=success&method=paypal',
      cancel_url: 'https://virtusfanmolfetta.com?payment=cancel'
    }
  }, token)
  if (order.error || !order.id) return jsonResponse({ error: order.message || 'Errore PayPal' }, 400)
  return jsonResponse({ orderId: order.id })
}

// ── PAYPAL: CATTURA PAGAMENTO ──
async function capturePaypalOrder(body) {
  const { orderId } = body
  const token = await paypalToken()
  const capture = await paypalRequest(`/v2/checkout/orders/${orderId}/capture`, 'POST', {}, token)
  if (capture.status !== 'COMPLETED') return jsonResponse({ error: 'Pagamento non completato', status: capture.status }, 400)
  const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
  if (!customId) return jsonResponse({ error: 'Dati ordine mancanti' }, 400)
  const meta = JSON.parse(customId)
  const userId = meta.user_id
  if (meta.tipo === 'membership') {
    const priceId = Object.keys(PRICE_TO_PIANO).find(k => PRICE_TO_PIANO[k] === meta.piano)
    await attivaMemebership(userId, priceId, { maglia_data: meta.maglia, posto_data: meta.posto, metodo: 'paypal' })
  } else if (meta.tipo === 'ricarica') {
    await confermanRicarica(userId, parseInt(meta.punti), parseFloat(meta.importo), 'paypal')
  }
  return jsonResponse({ success: true })
}

// ── STRIPE WEBHOOK ──
async function handleWebhook(request) {
  const payload = await request.text()
  let event
  try { event = JSON.parse(payload) } catch { return new Response('Invalid payload', { status: 400 }) }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const meta = session.metadata
    if (meta.tipo === 'membership') {
      if (meta.pending_id) {
        const pending = await supabaseQuery(`registrazioni_pending?id=eq.${meta.pending_id}&select=*`, 'GET')
        if (pending?.[0]) {
          const p = pending[0]
          const metaCompleto = {
            tifoso_nome: p.nome, tifoso_cognome: p.cognome, tifoso_pass: p.password_hash,
            tifoso_tel: p.telefono, tifoso_nascita: p.data_nascita,
            tifoso_marketing: p.marketing ? '1' : '0', tifoso_email: p.email, email: p.email,
            piano: p.piano, maglia_data: p.maglia_data ? JSON.stringify(p.maglia_data) : null,
            posto_data: p.posto_data ? JSON.stringify(p.posto_data) : null,
            accomp_data: p.accomp_data ? JSON.stringify(p.accomp_data) : null, metodo: 'stripe'
          }
          await attivaMemebership(null, meta.price_id, metaCompleto)
          await supabaseQuery(`registrazioni_pending?id=eq.${meta.pending_id}`, 'DELETE')
        }
      } else {
        await attivaMemebership(meta.user_id, meta.price_id, meta)
      }
    } else if (meta.tipo === 'ricarica') {
      await confermanRicarica(meta.user_id, parseInt(meta.punti), parseFloat(meta.importo), 'stripe')
    }
  }
  return new Response('OK', { status: 200 })
}

// ── ATTIVA MEMBERSHIP ──
async function attivaMemebership(userId, priceId, meta = {}) {
  const pianoNome = meta.piano || PRICE_TO_PIANO[priceId]
  if (!pianoNome) return
  const piani = await supabaseQuery(`membership_piani?nome=eq.${pianoNome}&select=id,punti_bonus`, 'GET')
  if (!piani || !piani[0]) return
  const pianoId = piani[0].id
  const puntiBonus = piani[0].punti_bonus || PRICE_TO_PUNTI[priceId] || 10
  let tifosoId = null
  if (meta.tifoso_nome && meta.tifoso_cognome && meta.tifoso_pass) {
    const emailDaUsare = meta.tifoso_email || meta.email || null
    if (!emailDaUsare) { console.error('ERRORE: email mancante', JSON.stringify(meta)); return }
    const authResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ email: emailDaUsare, password: meta.tifoso_pass, email_confirm: true, user_metadata: { nome: meta.tifoso_nome, cognome: meta.tifoso_cognome, ruolo: 'tifoso' } })
    })
    const authJson = await authResp.json()
    const authUserId = authJson.id
    if (!authUserId) { console.error('ERRORE createUser:', authJson.message || JSON.stringify(authJson)); return }
    const accompData = meta.accomp_data ? (typeof meta.accomp_data === 'string' ? JSON.parse(meta.accomp_data) : meta.accomp_data) : null
    const tifosoPayload = {
      auth_user_id: authUserId, nome: meta.tifoso_nome, cognome: meta.tifoso_cognome, email: emailDaUsare,
      telefono: meta.tifoso_tel || null, data_nascita: meta.tifoso_nascita || null,
      consenso_marketing: meta.tifoso_marketing === '1', punti_saldo: puntiBonus, stato: 'attivo',
      accompagnatore_minore: !!accompData,
      anno_nascita_minore: accompData?.anno_nascita_minore ? parseInt(accompData.anno_nascita_minore) : null,
      accompagnatore_stato: accompData ? 'in_attesa' : 'nessuno'
    }
    const tifosi = await supabaseQuery('tifosi', 'POST', tifosoPayload)
    tifosoId = tifosi?.[0]?.id || null
    if (!tifosoId) { console.error('ERRORE tifoso, authUserId:', authUserId); return }
  } else {
    // Recovery: cerca per auth_user_id, poi per email
    let tifosi = await supabaseQuery(`tifosi?auth_user_id=eq.${userId}&select=id,punti_saldo,email`, 'GET')
    if (!tifosi?.[0] && userId) {
      const authUser = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
      }).then(r => r.json())
      const emailAuth = authUser?.email
      if (emailAuth) {
        const tifosiByEmail = await supabaseQuery(`tifosi?email=eq.${encodeURIComponent(emailAuth)}&select=id,punti_saldo`, 'GET')
        if (tifosiByEmail?.[0]) {
          await supabaseQuery(`tifosi?id=eq.${tifosiByEmail[0].id}`, 'PATCH', { auth_user_id: userId })
          tifosi = tifosiByEmail
        }
      }
    }
    if (!tifosi?.[0]) return
    tifosoId = tifosi[0].id
    const nuoviPunti = (tifosi[0].punti_saldo || 0) + puntiBonus
    await supabaseQuery(`tifosi?id=eq.${tifosoId}`, 'PATCH', { punti_saldo: nuoviPunti, stato: 'attivo' })
  }
  const magliaData = meta?.maglia_data ? (typeof meta.maglia_data === 'string' ? JSON.parse(meta.maglia_data) : meta.maglia_data) : {}
  const oggi = new Date().toISOString().split('T')[0]
  const scadenza = new Date(); scadenza.setFullYear(scadenza.getFullYear() + 1)
  const metodo = meta.metodo || 'stripe'
  const membPayload = { piano_id: pianoId, stato: 'attiva', metodo_pagamento: metodo, valida_dal: oggi, valida_fino: scadenza.toISOString().split('T')[0], ...magliaData }
  const memberships = await supabaseQuery(`membership?tifoso_id=eq.${tifosoId}&select=id`, 'GET')
  if (memberships?.[0]) {
    await supabaseQuery(`membership?tifoso_id=eq.${tifosoId}`, 'PATCH', membPayload)
  } else {
    await supabaseQuery('membership', 'POST', { tifoso_id: tifosoId, ...membPayload })
  }
  await supabaseQuery('transazioni', 'POST', { tifoso_id: tifosoId, tipo: 'BONUS', punti_delta: puntiBonus, nota: `Pagamento ${metodo} - piano ${pianoNome}` })
  const postoRaw = meta?.posto_data
  if (postoRaw) {
    try {
      const posto = typeof postoRaw === 'string' ? JSON.parse(postoRaw) : postoRaw
      const membs = await supabaseQuery(`membership?tifoso_id=eq.${tifosoId}&select=id&order=created_at.desc&limit=1`, 'GET')
      await supabaseQuery(`posti?settore=eq.${posto.settore}&fila=eq.${posto.fila}&numero=eq.${posto.numero}`, 'PATCH', { stato: 'assegnato', tifoso_id: tifosoId, membership_id: membs?.[0]?.id || null })
    } catch(e) { console.error('Errore assegnazione posto:', e) }
  }
}

// ── CONFERMA RICARICA ──
async function confermanRicarica(userId, punti, importo, metodo = 'stripe') {
  const tifosi = await supabaseQuery(`tifosi?auth_user_id=eq.${userId}&select=punti_saldo`, 'GET')
  if (!tifosi?.[0]) return
  await supabaseQuery(`tifosi?auth_user_id=eq.${userId}`, 'PATCH', { punti_saldo: tifosi[0].punti_saldo + punti })
  await supabaseQuery('transazioni', 'POST', { tifoso_id: userId, tipo: 'RICARICA', punti_delta: punti, nota: `Ricarica online ${metodo} - €${importo}` })
  await supabaseQuery('ricariche', 'POST', { tifoso_id: userId, punti, importo_eur: importo, metodo: 'online', stato: 'confermata', confermata_il: new Date().toISOString() })
}

// ── NOTIFY TRASFERTA ──
async function handleNotifyTrasferta(request, env) {
  const { garaId, tipo, titolo, body } = await request.json()
  if (!garaId || !titolo || !body) return jsonResponse({ error: 'Parametri mancanti' }, 400)

  // Recupera tifosi con notifiche_trasferta = true
  const tifosiResp = await fetch(`${SUPABASE_URL}/rest/v1/tifosi?notifiche_trasferta=eq.true&stato=eq.attivo&select=id,push_subscription`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  })
  const tifosi = await tifosiResp.json()

  let inviati = 0
  for (const t of (tifosi || [])) {
    if (!t.push_subscription) continue
    try {
      const sub = JSON.parse(t.push_subscription)
      // Web Push semplificato — invia tramite endpoint del browser
      await fetch(sub.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'TTL': '86400' },
        body: JSON.stringify({ title: titolo, body, icon: '/logo_192.png', tag: `trasferta-${tipo}` })
      })
      inviati++
    } catch(e) { /* skip */ }
  }

  return jsonResponse({ success: true, inviati })
}

// ── CHATBOT AI ──
async function handleChat(request, env) {
  const body = await request.json()
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  })
  const data = await resp.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  })
}

// ── MAIN HANDLER ──
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() })

    const url = new URL(request.url)
    const path = url.pathname

    if (path === '/stripe-webhook' && request.method === 'POST') return handleWebhook(request)
    if (path === '/chat' && request.method === 'POST') return handleChat(request, env)
    if (path === '/notify-trasferta' && request.method === 'POST') return handleNotifyTrasferta(request, env)

    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    try {
      const body = await request.json()
      const { action, email, password, nome, cognome, user_metadata } = body

      if (action === 'register') {
        const supabaseResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY },
          body: JSON.stringify({ email, password, email_confirm: true, user_metadata: user_metadata || { nome, cognome, ruolo: 'tifoso' } })
        })
        const data = await supabaseResp.json()
        return new Response(JSON.stringify(data), { status: supabaseResp.status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } })
      }

      if (action === 'login') {
        const supabaseResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY },
          body: JSON.stringify({ email, password })
        })
        const data = await supabaseResp.json()
        return new Response(JSON.stringify(data), { status: supabaseResp.status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } })
      }

      if (action === 'create-checkout')      return createCheckout(body)
      if (action === 'create-paypal-order')  return createPaypalOrder(body)
      if (action === 'capture-paypal-order') return capturePaypalOrder(body)

      return jsonResponse({ error: 'Unknown action' }, 400)

    } catch (err) {
      return jsonResponse({ error: err.message }, 500)
    }
  }
}
