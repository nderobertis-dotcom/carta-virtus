// services/auth.service.js
// Gestisce registrazione, login e profilo tifosi e partner
import { supabase, supabaseAdmin, supabaseAs } from '../config/supabase.js'

// ─────────────────────────────────────────────
// TIFOSI
// ─────────────────────────────────────────────

/**
 * Registra un nuovo tifoso.
 * Crea l'utente in auth.users e il profilo in public.tifosi.
 *
 * @param {object} dati - { nome, cognome, email, password, telefono, data_nascita }
 * @returns {{ tifoso, session }}
 */
export async function registraTifoso({ nome, cognome, email, password, telefono, data_nascita }) {
  // 1. Crea utente in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome, cognome, ruolo: 'tifoso' }
    }
  })
  if (authError) throw new Error(`Auth error: ${authError.message}`)

  const authUserId = authData.user.id

  // 2. Crea profilo tifoso in public.tifosi
  const { data: tifoso, error: profileError } = await supabaseAdmin
    .from('tifosi')
    .insert({
      auth_user_id: authUserId,
      nome,
      cognome,
      email,
      telefono:     telefono ?? null,
      data_nascita: data_nascita ?? null
    })
    .select()
    .single()

  if (profileError) {
    // Rollback: elimina utente auth se il profilo fallisce
    await supabaseAdmin.auth.admin.deleteUser(authUserId)
    throw new Error(`Profilo error: ${profileError.message}`)
  }

  return { tifoso, session: authData.session }
}

/**
 * Login tifoso/partner con email e password.
 * @returns {{ user, session, profilo }}
 */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Login fallito: ${error.message}`)

  // Recupera profilo (tifoso o partner)
  const profilo = await getProfiloByAuthId(data.user.id)

  return { user: data.user, session: data.session, profilo }
}

/**
 * Logout.
 */
export async function logout(accessToken) {
  const client = supabaseAs(accessToken)
  const { error } = await client.auth.signOut()
  if (error) throw new Error(error.message)
}

/**
 * Recupera il profilo completo del tifoso loggato.
 * @param {string} accessToken - JWT della sessione
 */
export async function getMioProfilo(accessToken) {
  const client = supabaseAs(accessToken)
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError) throw new Error(userError.message)

  const { data, error } = await client
    .from('tifosi')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Aggiorna il profilo del tifoso loggato.
 * @param {string} accessToken
 * @param {object} campi - campi da aggiornare (nome, cognome, telefono, ecc.)
 */
export async function aggiornaProfilo(accessToken, campi) {
  const client = supabaseAs(accessToken)
  const { data: { user } } = await client.auth.getUser()

  // Campi sicuri che il tifoso può modificare (whitelist)
  const campiConsentiti = ['nome', 'cognome', 'telefono', 'data_nascita',
                           'consenso_marketing', 'consenso_profiling']
  const payload = {}
  for (const k of campiConsentiti) {
    if (campi[k] !== undefined) payload[k] = campi[k]
  }

  const { data, error } = await client
    .from('tifosi')
    .update(payload)
    .eq('auth_user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Reset password via email.
 */
export async function richiestaResetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password`
  })
  if (error) throw new Error(error.message)
  return { ok: true }
}

// ─────────────────────────────────────────────
// PARTNER (creati dall'admin, non si registrano da soli)
// ─────────────────────────────────────────────

/**
 * Crea un account partner (solo admin).
 * @param {string} adminToken - JWT dell'admin Virtus
 * @param {object} dati - dati del partner
 */
export async function creaPartner(adminToken, {
  nome_negozio, categoria, indirizzo, citta,
  referente_nome, referente_email, referente_tel,
  punti_per_euro = 1.00
}) {
  // Verifica che il chiamante sia admin
  await verificaRuolo(adminToken, 'admin')

  // Genera password temporanea
  const passwordTemp = generaPasswordTemp()

  // Crea utente auth per il partner
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: referente_email,
    password: passwordTemp,
    email_confirm: true,
    user_metadata: { ruolo: 'partner', nome_negozio }
  })
  if (authError) throw new Error(authError.message)

  // Crea profilo partner
  const { data: partner, error } = await supabaseAdmin
    .from('partner')
    .insert({
      auth_user_id: authData.user.id,
      nome_negozio, categoria, indirizzo,
      citta: citta ?? 'Molfetta',
      referente_nome, referente_email, referente_tel,
      punti_per_euro
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return { partner, passwordTemp }
}

// ─────────────────────────────────────────────
// HELPERS INTERNI
// ─────────────────────────────────────────────

async function getProfiloByAuthId(authUserId) {
  // Prova prima tifosi
  const { data: tifoso } = await supabaseAdmin
    .from('tifosi')
    .select('*, ruolo:\'tifoso\'')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (tifoso) return { ...tifoso, ruolo: 'tifoso' }

  // Poi partner
  const { data: partner } = await supabaseAdmin
    .from('partner')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (partner) return { ...partner, ruolo: 'partner' }

  return null
}

export async function verificaRuolo(accessToken, ruoloRichiesto) {
  const client = supabaseAs(accessToken)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new Error('Token non valido')

  const ruolo = user.user_metadata?.ruolo
  if (ruolo !== ruoloRichiesto) {
    throw new Error(`Accesso negato: richiesto ruolo "${ruoloRichiesto}", hai "${ruolo}"`)
  }
  return user
}

function generaPasswordTemp() {
  return Math.random().toString(36).slice(2, 10) +
         Math.random().toString(36).slice(2, 10).toUpperCase() + '!'
}
