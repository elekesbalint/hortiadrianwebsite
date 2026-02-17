/**
 * Script az admin felhasználó email és jelszó módosításához
 * Futtatás: npx tsx app/scripts/update-admin-credentials.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Hiányzó környezeti változók: NEXT_PUBLIC_SUPABASE_URL vagy SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function updateAdminCredentials() {
  try {
    // Admin felhasználó ID lekérése
    const { data: adminUsers, error: adminError } = await admin
      .from('admin_users')
      .select('user_id')
      .limit(1)
      .single()

    if (adminError || !adminUsers) {
      console.error('Nem található admin felhasználó:', adminError?.message)
      process.exit(1)
    }

    const userId = adminUsers.user_id

    // Email és jelszó frissítése
    const { data, error } = await admin.auth.admin.updateUserById(userId, {
      email: 'AProgram@programlaz.hu',
      password: 'Boat2026!',
      user_metadata: { name: 'AProgram' },
    })

    if (error) {
      console.error('Hiba a frissítés során:', error.message)
      process.exit(1)
    }

    console.log('✅ Admin felhasználó sikeresen frissítve!')
    console.log('Email:', data.user.email)
    console.log('Felhasználónév: AProgram')
    console.log('Jelszó: Boat2026!')
  } catch (error) {
    console.error('Váratlan hiba:', error)
    process.exit(1)
  }
}

updateAdminCredentials()
