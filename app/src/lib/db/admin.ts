'use server'

import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * Admin felhasználó email és jelszó módosítása (service_role szükséges)
 */
export async function updateAdminCredentials(
  userId: string,
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = createServerSupabaseClient()
    
    // Email frissítése
    const { error: emailError } = await admin.auth.admin.updateUserById(userId, {
      email,
      user_metadata: { name: 'AProgram' },
    })
    
    if (emailError) {
      return { ok: false, error: `Email frissítés hiba: ${emailError.message}` }
    }
    
    // Jelszó frissítése
    const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
      password,
    })
    
    if (passwordError) {
      return { ok: false, error: `Jelszó frissítés hiba: ${passwordError.message}` }
    }
    
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ismeretlen hiba' }
  }
}
