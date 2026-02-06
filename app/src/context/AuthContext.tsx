'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type AuthContextType = {
  isLoggedIn: boolean
  user: { name?: string; email?: string; id?: string } | null
  isAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function userFromSupabase(u: User | null): { name?: string; email?: string; id?: string } | null {
  if (!u) return null
  const name = u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email?.split('@')[0]
  return { id: u.id, email: u.email ?? undefined, name: name ?? undefined }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ name?: string; email?: string; id?: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchAdminStatus = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    setIsAdmin(!!data)
  }, [])

  const updateFromSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const nextUser = session?.user ? userFromSupabase(session.user) : null
    setUser(nextUser)
    if (nextUser?.id) {
      await fetchAdminStatus(nextUser.id)
    } else {
      setIsAdmin(false)
    }
    setLoading(false)
  }, [fetchAdminStatus])

  useEffect(() => {
    updateFromSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ? userFromSupabase(session.user) : null
      setUser(nextUser)
      if (nextUser?.id) {
        fetchAdminStatus(nextUser.id)
      } else {
        setIsAdmin(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [updateFromSession, fetchAdminStatus])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
  }, [])

  const value: AuthContextType = {
    isLoggedIn: !!user,
    user,
    isAdmin,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
