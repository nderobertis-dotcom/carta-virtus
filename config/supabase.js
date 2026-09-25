// config/supabase.js
// Client Supabase condiviso — importato da tutti i servizi
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = process.env.SUPABASE_URL     || 'https://brwkwlyxkptzmkzkava.supabase.co'
const SUPABASE_ANON    = process.env.SUPABASE_ANON_KEY || ''   // chiave anon (pubblica)
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY || '' // chiave service_role (privata — solo backend)

// Client pubblico: rispetta RLS — usato nelle richieste utente
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// Client admin: bypassa RLS — usato solo nelle operazioni server-side privilegiate
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Helper: crea un client autenticato con il JWT del tifoso/partner
export function supabaseAs(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  })
}
