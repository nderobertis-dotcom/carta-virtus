// index.js
// Entry point — esporta tutti i microservizi
// Usalo come: import { auth, punti, premi, partner, notifiche } from './index.js'

export * as auth       from './services/auth.service.js'
export * as punti      from './services/punti.service.js'
export * as premi      from './services/premi.service.js'
export * as partner    from './services/partner.service.js'
export * as notifiche  from './services/notifiche.service.js'

// ─────────────────────────────────────────────
// ESEMPIO D'USO (da un controller Express / route handler):
// ─────────────────────────────────────────────
//
// import { punti, premi, notifiche } from '../index.js'
//
// // Scanner QR del partner — POST /api/scanner/acquisto
// app.post('/api/scanner/acquisto', async (req, res) => {
//   const token = req.headers.authorization?.replace('Bearer ', '')
//   const { qr_code, importo_eur } = req.body
//   try {
//     const transazione = await punti.registraAcquisto(token, { qr_code, importo_eur })
//     await notifiche.notificaPuntiAccumulati(transazione.tifoso_id, {
//       punti_delta:  transazione.punti_delta,
//       partner_nome: 'Nome negozio',
//       saldo_nuovo:  transazione.saldo_dopo
//     })
//     res.json({ ok: true, transazione })
//   } catch (err) {
//     res.status(400).json({ error: err.message })
//   }
// })
//
// // App tifoso — GET /api/tifoso/saldo
// app.get('/api/tifoso/saldo', async (req, res) => {
//   const token = req.headers.authorization?.replace('Bearer ', '')
//   const saldo = await punti.getMioSaldo(token)
//   res.json(saldo)
// })
//
// // Riscatta premio — POST /api/tifoso/riscatta
// app.post('/api/tifoso/riscatta', async (req, res) => {
//   const token = req.headers.authorization?.replace('Bearer ', '')
//   const { premio_id } = req.body
//   const riscatto = await premi.riscattaPremio(token, premio_id)
//   await notifiche.notificaCouponEmesso(riscatto.tifoso_id, riscatto)
//   res.json(riscatto)
// })
