import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase környezeti változók hiányoznak. Másold a .env.local.example fájlt .env.local-ra, ' +
    'töltsd ki a NEXT_PUBLIC_SUPABASE_URL és NEXT_PUBLIC_SUPABASE_ANON_KEY értékeket a Supabase projektből ' +
    '(Dashboard → Project Settings → API), majd indítsd újra a dev szervert.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client with service role (for admin operations)
export const createServerSupabaseClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY hiányzik a .env.local-ból.')
  }
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
