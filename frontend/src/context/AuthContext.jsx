import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('netguard_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  // Fetch current user details on load if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`${apiBase}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        } else {
          // Token is expired or invalid
          localStorage.removeItem('netguard_token')
          setToken(null)
          setUser(null)
        }
      } catch (err) {
        console.error('Failed to verify token:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [token, apiBase])

  const login = async (email, password) => {
    const res = await fetch(`${apiBase}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.detail || 'Authentication failed')
    }

    localStorage.setItem('netguard_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const register = async (name, email, password, role = 'analyst') => {
    const res = await fetch(`${apiBase}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.detail || 'Registration failed')
    }

    // Automatically log in after registration
    return await login(email, password)
  }

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${apiBase}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (e) {
      // Ignored
    } finally {
      localStorage.removeItem('netguard_token')
      setToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
