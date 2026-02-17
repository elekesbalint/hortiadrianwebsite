import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Hiányzó környezeti változók' },
        { status: 500 }
      )
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Admin felhasználó ID lekérése
    const { data: adminUsers, error: adminError } = await admin
      .from('admin_users')
      .select('user_id')
      .limit(1)
      .single()

    if (adminError || !adminUsers) {
      return NextResponse.json(
        { error: `Nem található admin felhasználó: ${adminError?.message}` },
        { status: 404 }
      )
    }

    const userId = adminUsers.user_id

    // Email és jelszó frissítése
    const { data, error } = await admin.auth.admin.updateUserById(userId, {
      email: 'AProgram@programlaz.hu',
      password: 'Boat2026!',
      user_metadata: { name: 'AProgram' },
    })

    if (error) {
      return NextResponse.json(
        { error: `Frissítés hiba: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      email: data.user.email,
      message: 'Admin felhasználó sikeresen frissítve!',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ismeretlen hiba' },
      { status: 500 }
    )
  }
}
