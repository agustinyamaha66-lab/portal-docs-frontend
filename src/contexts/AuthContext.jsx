import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      if (u && !u.email?.endsWith('@valdishopper.com')) {
        supabase.auth.signOut()
        setUser(null)
      } else {
        setUser(u)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      if (u && !u.email?.endsWith('@valdishopper.com')) {
        supabase.auth.signOut()
        setUser(null)
      } else {
        setUser(u)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      hd: 'valdishopper.com',
      redirectTo: window.location.origin
    }
  })

  const logout = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
