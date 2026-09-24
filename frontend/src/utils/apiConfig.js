/**
 * NetGuard AI - Centralized API & WebSocket Configuration
 * 
 * Supports:
 * - Local development: http://localhost:8000
 * - Production / Vercel: https://netguard-ai-backend-fx2q.onrender.com
 * - Dynamic override via VITE_API_BASE_URL
 * - Protocol-aware WebSocket conversion (ws:// in dev, wss:// on HTTPS production)
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://netguard-ai-backend-fx2q.onrender.com'
    : 'http://localhost:8000')
).replace(/\/+$/, '')

export const getWebSocketUrl = (path = '/api/v1/realtime/ws/live-traffic') => {
  // If explicitly overridden via env
  if (import.meta.env.VITE_WS_URL) {
    const base = import.meta.env.VITE_WS_URL.replace(/\/+$/, '')
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${cleanPath}`
  }

  // Derive protocol and host from API_BASE_URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const isSecure = API_BASE_URL.startsWith('https://')
  const protocol = isSecure ? 'wss:' : 'ws:'
  const host = API_BASE_URL.replace(/^https?:\/\//, '')
  return `${protocol}//${host}${cleanPath}`
}

export const API_DOCS_URL = `${API_BASE_URL}/docs`
