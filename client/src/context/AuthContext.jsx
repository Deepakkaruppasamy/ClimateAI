import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('climate_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Failed to parse saved user session:', e)
        localStorage.removeItem('climate_user')
      }
    }
    setLoading(false)
  }, [])

  // Log in with email and password
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      setUser(data.user)
      localStorage.setItem('climate_user', JSON.stringify(data.user))
      return { success: true, user: data.user }
    } catch (err) {
      console.error('Login error:', err.message)
      throw err
    }
  }

  // Register with name, email, and password
  const signup = async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setUser(data.user)
      localStorage.setItem('climate_user', JSON.stringify(data.user))
      return { success: true, user: data.user }
    } catch (err) {
      console.error('Signup error:', err.message)
      throw err
    }
  }

  // Update local user state (used after profile edits)
  const updateUser = (patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch }
      localStorage.setItem('climate_user', JSON.stringify(updated))
      return updated
    })
  }

  // Log out of the session
  const logout = () => {
    setUser(null)
    localStorage.removeItem('climate_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
