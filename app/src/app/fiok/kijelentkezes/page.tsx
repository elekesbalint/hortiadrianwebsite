'use client'

import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LogOut } from 'lucide-react'

export default function FiokKijelentkezesPage() {
  const { signOut, user } = useAuth()

  const handleLogout = async () => {
    await signOut()
    if (typeof window !== 'undefined') window.location.href = '/'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Kijelentkezés</h1>
        <p className="text-gray-500 mt-1">Kilépés a fiókodból.</p>
      </div>

      <Card>
        <CardContent className="p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <LogOut className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Biztosan ki szeretnél lépni?</h2>
          <p className="text-gray-500 mb-6">
            {user?.email && (
              <>Jelenleg bejelentkezve vagy: <strong>{user.email}</strong></>
            )}
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLogout}
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          >
            <LogOut className="h-5 w-5" />
            Kijelentkezés
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
