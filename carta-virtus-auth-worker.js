const SUPABASE_URL = 'https://brwkwlyxkptzmkzkvava.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyd2t3bHl4a3B0em1remt2YXZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUzMTc1MCwiZXhwIjoyMDk0MTA3NzUwfQ.Pb61V8euQwLt1KR-m29nr_s0F13gRXSToRiPPL6bLSQ'
const STRIPE_SECRET = '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'
const STRIPE_WEBHOOK_SECRET = 'whsec_aArvecoVPkKFvDcpAsoCFtGfZThax6L4'
const PAYPAL_CLIENT_ID = 'AXmqt2tfdCpl1F1latg1zMn8VcujvcKq0vic3955bSf2q7yvN47UJbavPs5ajAQWQFFwvetBnT_XII3Z'
const PAYPAL_CLIENT_SECRET = 'EPpjPxVKblXAIECjUKOX7ghtE0VKO6cbsyXZhwKG5qqiNUOQ8iiBQCTuQqMOiFLXpTlRbFAXEGIzJ9Vf'
const PAYPAL_API = 'https://api-m.paypal.com'
const ALLOWED_ORIGIN = '*'
const LOGO_VIRTUS = 'data:image/jpeg;base64,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'

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
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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

// ── EMAIL TRASFERTA ──
function buildEmailHtml({ tipo, avversario, luogo, competizione, casaPts, virtusPts, parziali, sponsorNome, sponsorLogo, dataOra }) {
  const blu = '#1565C0'
  const bluScuro = '#0D47A1'
  const bluGhost = '#E3F0FF'

  const quarti = ['1°Q','2°Q','3°Q','4°Q']

  // Riga parziali per il tabellone
  let parzialiRows = ''
  if (parziali && parziali.length) {
    const casaCumul = [], virtusCumul = []
    let cc = 0, vc = 0
    parziali.forEach((p, i) => {
      cc += p.casa; vc += p.virtus
      casaCumul.push(cc); virtusCumul.push(vc)
    })
    parzialiRows = `
      <tr>
        <td style="padding:6px 12px;font-size:13px;color:#555">${avversario}</td>
        ${parziali.map(p => `<td style="padding:6px 8px;text-align:center;font-size:13px;color:#555">${p.casa}</td>`).join('')}
        <td style="padding:6px 12px;text-align:center;font-size:15px;font-weight:800;color:#333">${casaPts}</td>
      </tr>
      <tr style="background:${bluGhost}">
        <td style="padding:6px 12px;font-size:13px;font-weight:700;color:${bluScuro}">Virtus Molfetta</td>
        ${parziali.map(p => `<td style="padding:6px 8px;text-align:center;font-size:13px;font-weight:700;color:${bluScuro}">${p.virtus}</td>`).join('')}
        <td style="padding:6px 12px;text-align:center;font-size:15px;font-weight:800;color:${bluScuro}">${virtusPts}</td>
      </tr>`
  } else {
    parzialiRows = `
      <tr>
        <td style="padding:6px 12px;font-size:13px;color:#555">${avversario}</td>
        <td style="padding:6px 12px;text-align:center;font-size:15px;font-weight:800;color:#333">${casaPts ?? '—'}</td>
      </tr>
      <tr style="background:${bluGhost}">
        <td style="padding:6px 12px;font-size:13px;font-weight:700;color:${bluScuro}">Virtus Molfetta</td>
        <td style="padding:6px 12px;text-align:center;font-size:15px;font-weight:800;color:${bluScuro}">${virtusPts ?? '—'}</td>
      </tr>`
  }

  // Header per quarto intestazione colonne
  const headerCols = parziali && parziali.length
    ? quarti.slice(0, parziali.length).map(q => `<th style="padding:6px 8px;text-align:center;font-size:11px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:.05em">${q}</th>`).join('') + `<th style="padding:6px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.05em">TOT</th>`
    : `<th style="padding:6px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff">TOT</th>`

  // Titolo e badge per tipo
  let badge = '', titolo = '', sottotitolo = ''
  if (tipo === 'inizio') {
    badge = `<span style="display:inline-block;background:#22c55e;color:#fff;font-size:12px;font-weight:700;padding:4px 14px;border-radius:9999px;letter-spacing:.05em;text-transform:uppercase">🟢 Inizio gara</span>`
    titolo = `La gara ${avversario} – Virtus Molfetta è appena iniziata`
    sottotitolo = `Segui la partita in diretta — aggiornamenti al termine di ogni quarto.`
  } else if (tipo === 'finale') {
    badge = `<span style="display:inline-block;background:#22c55e;color:#fff;font-size:12px;font-weight:700;padding:4px 14px;border-radius:9999px;letter-spacing:.05em;text-transform:uppercase">🏆 Risultato finale</span>`
    titolo = 'Partita terminata!'
    sottotitolo = virtusPts > casaPts ? '🎉 Vittoria della Virtus!' : virtusPts === casaPts ? 'Pareggio' : 'Sconfitta — forza ragazzi!'
  } else {
    const qLabel = tipo === '1q' ? '1°' : tipo === '2q' ? '2°' : '3°'
    badge = `<span style="display:inline-block;background:${blu};color:#fff;font-size:12px;font-weight:700;padding:4px 14px;border-radius:9999px;letter-spacing:.05em;text-transform:uppercase">🏀 Fine ${qLabel} quarto</span>`
    titolo = `Parziale dopo il ${qLabel} quarto`
    sottotitolo = `Risultato aggiornato — altri aggiornamenti in arrivo.`
  }

  // Sezione sponsor
  const sponsorHtml = sponsorNome ? `
    <div style="text-align:center;padding:20px 24px;border-top:1px solid #e5e7eb">
      <p style="margin:0 0 10px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em">Con il supporto di</p>
      ${sponsorLogo ? `<img src="${sponsorLogo}" alt="${sponsorNome}" style="max-height:48px;max-width:180px;object-fit:contain;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto">` : ''}
      <p style="margin:0;font-size:14px;font-weight:700;color:#374151">${sponsorNome}</p>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Virtus Molfetta — ${titolo}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,${blu},${bluScuro});padding:24px 32px;text-align:center">
    <img src="${LOGO_VIRTUS}" alt="Virtus Molfetta" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;border:3px solid rgba(255,255,255,.3)">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.12em">Virtus Fan Card</p>
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-.01em">VIRTUS MOLFETTA</p>
    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.75)">${competizione || 'Serie B Interregionale Girone E — Regular Season'}</p>
  </td></tr>

  <!-- Badge + titolo -->
  <tr><td style="padding:28px 32px 20px;text-align:center">
    ${badge}
    <h1 style="margin:16px 0 8px;font-size:20px;font-weight:800;color:#111827;line-height:1.3">${titolo}</h1>
    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5">${sottotitolo}</p>
  </td></tr>

  <!-- Info gara -->
  <tr><td style="padding:0 32px 20px">
    <table width="100%" style="background:#f9fafb;border-radius:10px;overflow:hidden">
      ${tipo === 'inizio' ? `<tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb">
          <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;display:block">Data</span>
          <span style="font-size:14px;font-weight:700;color:#111827">${dataOra ? dataOra.split(' ')[0] : '—'}</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb">
          <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;display:block">Ora</span>
          <span style="font-size:14px;font-weight:700;color:#111827">${dataOra ? dataOra.split(' ')[1] : '—'}</span>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:12px 16px">
          <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;display:block">Campo</span>
          <span style="font-size:14px;font-weight:700;color:#111827">${luogo || '—'}</span>
        </td>
      </tr>` : `<tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb">
          <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;display:block">Avversario</span>
          <span style="font-size:14px;font-weight:700;color:#111827">${avversario}</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb">
          <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;display:block">Campo</span>
          <span style="font-size:14px;font-weight:700;color:#111827">${luogo || '—'}</span>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:12px 16px">
          <span style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:4px">Situazione</span>
          <span style="display:inline-block;font-size:12px;font-weight:700;color:${tipo === 'finale' ? '#15803d' : '#b45309'};background:${tipo === 'finale' ? '#dcfce7' : '#fef3c7'};padding:3px 10px;border-radius:9999px">${tipo === 'finale' ? '✅ Finale' : '🔴 In corso'}</span>
        </td>
      </tr>`}
    </table>
  </td></tr>

  ${tipo !== 'inizio' ? `<!-- Tabellone -->
  <tr><td style="padding:0 32px 24px">
    <table width="100%" style="border-radius:10px;overflow:hidden;border-collapse:collapse">
      <thead>
        <tr style="background:${bluScuro}">
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.05em">Squadra</th>
          ${headerCols}
        </tr>
      </thead>
      <tbody>${parzialiRows}</tbody>
    </table>
  </td></tr>` : ''}

  ${sponsorHtml}

  <!-- Footer -->
  <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0 0 6px;font-size:12px;color:#9ca3af">Virtus Fan Card · virtusfanmolfetta.com</p>
    <a href="https://virtusfanmolfetta.com" style="font-size:11px;color:#9ca3af;text-decoration:none">Disattiva notifiche trasferta</a>
  </td></tr>

</table>
</td></tr></table>
</body></html>`
}

async function handleEmailTrasferta(request, env) {
  const body = await request.json()
  const { garaId, tipo, avversario, luogo, competizione, casaPts, virtusPts, parziali, sponsorNome, sponsorLogo, dataOra } = body

  if (!tipo || !avversario) return jsonResponse({ error: 'Parametri mancanti' }, 400)
  if (!env.RESEND_API_KEY) return jsonResponse({ error: 'RESEND_API_KEY non configurata' }, 500)

  // Carica tifosi con notifiche_trasferta attive
  const tifosi = await supabaseQuery('tifosi?notifiche_trasferta=eq.true&stato=eq.attivo&select=email,nome,cognome', 'GET')
  if (!tifosi || !tifosi.length) return jsonResponse({ ok: true, inviati: 0, nota: 'Nessun tifoso con notifiche attive' })

  const soggetti = {
    inizio: `🟢 Inizio gara — ${avversario} vs Virtus Molfetta`,
    '1q':   `🏀 Fine 1° quarto — ${avversario} ${casaPts}-${virtusPts} Virtus`,
    '2q':   `🏀 Fine 2° quarto — ${avversario} ${casaPts}-${virtusPts} Virtus`,
    '3q':   `🏀 Fine 3° quarto — ${avversario} ${casaPts}-${virtusPts} Virtus`,
    finale: `🏆 Risultato finale — ${avversario} ${casaPts}-${virtusPts} Virtus Molfetta`,
  }
  const soggetto = soggetti[tipo] || `Aggiornamento gara — ${avversario}`
  const html = buildEmailHtml({ tipo, avversario, luogo, competizione, casaPts, virtusPts, parziali, sponsorNome, sponsorLogo, dataOra })

  // Invia a tutti i tifosi (batch, max 50 per chiamata Resend)
  const emails = tifosi.map(t => t.email).filter(Boolean)
  let inviati = 0, errori = []

  // Resend supporta to: array (max 50)
  const chunks = []
  for (let i = 0; i < emails.length; i += 50) chunks.push(emails.slice(i, i + 50))

  for (const chunk of chunks) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Virtus Fan Card <noreply@virtusfanmolfetta.com>',
        to: chunk,
        subject: soggetto,
        html,
      })
    })
    const result = await res.json()
    if (res.ok) inviati += chunk.length
    else errori.push(result)
  }

  // Aggiorna flag su Supabase
  if (garaId && inviati > 0) {
    const flagMap = {
      inizio:  { notifica_inizio_inviata: true },
      '1q':    { notifica_1q_inviata: true },
      '2q':    { notifica_2q_inviata: true },
      '3q':    { notifica_3q_inviata: true },
      finale:  { notifica_finale_inviata: true },
    }
    if (flagMap[tipo]) {
      await supabaseQuery(`gare?id=eq.${garaId}`, 'PATCH', flagMap[tipo])
    }
  }

  if (errori.length) return jsonResponse({ ok: false, inviati, errori }, 500)
  return jsonResponse({ ok: true, inviati })
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

    const url  = new URL(request.url)
    const path = url.pathname

    if (path === '/stripe-webhook'    && request.method === 'POST') return handleWebhook(request)
    if (path === '/chat'              && request.method === 'POST') return handleChat(request, env)
    if (path === '/email-trasferta'   && request.method === 'POST') return handleEmailTrasferta(request, env)

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

      if (action === 'activate_operator') {
        if (!email) return jsonResponse({ error: 'Email mancante' }, 400)
        // Trova utente per email tramite Admin API
        const listResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}&page=1&per_page=1`, {
          headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
        })
        const listData = await listResp.json()
        const users = listData.users || listData
        const user = Array.isArray(users) ? users[0] : null
        if (!user) return jsonResponse({ error: 'Utente non trovato' }, 404)
        // Aggiorna ruolo a 'operatore' preservando gli altri metadati
        const existing = user.user_metadata || {}
        const patchResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY },
          body: JSON.stringify({ user_metadata: { ...existing, ruolo: 'operatore' } })
        })
        const patchData = await patchResp.json()
        if (!patchResp.ok) return jsonResponse({ error: patchData.message || 'Errore aggiornamento' }, patchResp.status)
        return jsonResponse({ ok: true, userId: user.id })
      }

      if (action === 'list_pending_operators') {
        // Recupera utenti con ruolo operatore_pending dalla Admin API
        const listResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`, {
          headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
        })
        const listData = await listResp.json()
        const allUsers = listData.users || []
        const pending = allUsers
          .filter(u => u.user_metadata?.ruolo === 'operatore_pending')
          .map(u => ({
            id: u.id,
            email: u.email,
            nome: u.user_metadata?.nome || '',
            cognome: u.user_metadata?.cognome || '',
            created_at: u.created_at
          }))
        return jsonResponse(pending)
      }

      return jsonResponse({ error: 'Unknown action' }, 400)

    } catch (err) {
      return jsonResponse({ error: err.message }, 500)
    }
  }
}
