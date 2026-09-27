const SUPABASE_URL = 'https://brwkwlyxkptzmkzkvava.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyd2t3bHl4a3B0em1remt2YXZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUzMTc1MCwiZXhwIjoyMDk0MTA3NzUwfQ.Pb61V8euQwLt1KR-m29nr_s0F13gRXSToRiPPL6bLSQ'
const STRIPE_SECRET = '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'
const STRIPE_WEBHOOK_SECRET = 'whsec_aArvecoVPkKFvDcpAsoCFtGfZThax6L4'
const PAYPAL_CLIENT_ID = 'AXmqt2tfdCpl1F1latg1zMn8VcujvcKq0vic3955bSf2q7yvN47UJbavPs5ajAQWQFFwvetBnT_XII3Z'
const PAYPAL_CLIENT_SECRET = 'EPpjPxVKblXAIECjUKOX7ghtE0VKO6cbsyXZhwKG5qqiNUOQ8iiBQCTuQqMOiFLXpTlRbFAXEGIzJ9Vf'
const PAYPAL_API = 'https://api-m.paypal.com'
const ALLOWED_ORIGIN = '*'
const LOGO_VIRTUS = 'https://brwkwlyxkptzmkzkvava.supabase.co/storage/v1/object/public/Logo/logo-virtus.jpg'

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
  const { garaId, tipo, avversario, luogo, competizione, casaPts, virtusPts, parziali, sponsorNome, sponsorLogo, dataOra, testMode } = body

  console.log('handleEmailTrasferta called:', JSON.stringify({ garaId, tipo, avversario, luogo, testMode }))
  if (!tipo || !avversario) return jsonResponse({ error: 'Parametri mancanti' }, 400)
  if (!env.BREVO_API_KEY) { console.error('BREVO_API_KEY mancante'); return jsonResponse({ error: 'BREVO_API_KEY non configurata' }, 500) }

  const ADMIN_CC = 'nderobertis@gmail.com'

  // In testMode manda solo all'admin, senza caricare i tifosi
  let emails
  if (testMode) {
    emails = [ADMIN_CC]
  } else {
    // Carica tifosi con notifiche_trasferta attive
    const tifosi = await supabaseQuery('tifosi?notifiche_trasferta=eq.true&stato=eq.attivo&select=email,nome,cognome', 'GET')
    if (!tifosi || !tifosi.length) return jsonResponse({ ok: true, inviati: 0, nota: 'Nessun tifoso con notifiche attive' })
    emails = [...new Set([...tifosi.map(t => t.email).filter(Boolean), ADMIN_CC])]
  }

  const soggetti = {
    inizio: `🟢 Inizio gara — ${avversario} vs Virtus Molfetta`,
    '1q':   `🏀 Fine 1° quarto — ${avversario} ${casaPts}-${virtusPts} Virtus`,
    '2q':   `🏀 Fine 2° quarto — ${avversario} ${casaPts}-${virtusPts} Virtus`,
    '3q':   `🏀 Fine 3° quarto — ${avversario} ${casaPts}-${virtusPts} Virtus`,
    finale: `🏆 Risultato finale — ${avversario} ${casaPts}-${virtusPts} Virtus Molfetta`,
  }
  const soggetto = soggetti[tipo] || `Aggiornamento gara — ${avversario}`
  const html = buildEmailHtml({ tipo, avversario, luogo, competizione, casaPts, virtusPts, parziali, sponsorNome, sponsorLogo, dataOra })

  let inviati = 0, errori = []

  // Brevo: invia in parallelo (una chiamata per destinatario)
  const results = await Promise.allSettled(emails.map(email =>
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Virtus Fan Card', email: 'noreply@virtusfanmolfetta.com' },
        to: [{ email }],
        subject: soggetto,
        htmlContent: html,
      })
    }).then(async res => {
      const result = await res.json()
      console.log('Brevo status:', res.status, email, JSON.stringify(result))
      if (res.ok) return { ok: true }
      else { console.error('Brevo error:', res.status, email, JSON.stringify(result)); return { ok: false, result } }
    })
  ))

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.ok) inviati++
    else errori.push(r.reason || r.value?.result)
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

// ── COMUNICATI STAMPA ──
async function handleEmailComunicato(request, env) {
  const body = await request.json()
  const { titolo, testo, inviato_da } = body

  if (!titolo || !testo) return jsonResponse({ error: 'Parametri mancanti: titolo e testo obbligatori' }, 400)
  if (!env.BREVO_API_KEY) return jsonResponse({ error: 'BREVO_API_KEY non configurata' }, 500)

  // Carica testate attive
  const testate = await supabaseQuery('testate?attiva=eq.true&select=nome,email', 'GET')
  if (!testate || !testate.length) return jsonResponse({ ok: true, inviati: 0, nota: 'Nessuna testata attiva' })

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;">
    <div style="background:#003087;padding:24px 32px;text-align:center;">
      <img src="${LOGO_VIRTUS}" alt="Virtus Molfetta" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #fff;">
      <h1 style="color:#fff;font-size:20px;margin:12px 0 4px;">Nuova Basket Virtus Molfetta</h1>
      <p style="color:#cce0ff;font-size:13px;margin:0;">COMUNICATO STAMPA UFFICIALE</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#003087;font-size:22px;margin:0 0 24px;border-bottom:2px solid #003087;padding-bottom:12px;">${titolo}</h2>
      <div style="color:#333;font-size:15px;line-height:1.7;white-space:pre-wrap;">${testo}</div>
    </div>
    <div style="background:#f5f5f5;padding:20px 32px;text-align:center;border-top:1px solid #ddd;">
      <p style="color:#666;font-size:12px;margin:0;">Nuova Basket Virtus Molfetta — Ufficio Stampa</p>
      <p style="color:#666;font-size:12px;margin:4px 0 0;">virtusfanmolfetta.com</p>
    </div>
  </div>`

  let inviati = 0, errori = []

  const results = await Promise.allSettled(testate.map(t =>
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Ufficio Stampa Virtus Molfetta', email: 'noreply@virtusfanmolfetta.com' },
        to: [{ email: t.email, name: t.nome }],
        subject: `[COMUNICATO STAMPA] ${titolo}`,
        htmlContent: html,
      })
    }).then(async res => {
      const result = await res.json()
      if (res.ok) return { ok: true }
      else return { ok: false, result }
    })
  ))

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.ok) inviati++
    else errori.push(r.reason || r.value?.result)
  }

  // Salva comunicato su Supabase
  if (inviati > 0) {
    await supabaseQuery('comunicati', 'POST', {
      titolo,
      testo,
      inviato_at: new Date().toISOString(),
      inviato_da: inviato_da || 'addetto_stampa',
      destinatari_count: inviati,
    })
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
    if (path === '/email-comunicato'  && request.method === 'POST') return handleEmailComunicato(request, env)

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
