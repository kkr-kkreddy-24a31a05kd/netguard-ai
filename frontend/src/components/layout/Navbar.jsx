import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, ExternalLink, Menu, X, LogIn, LogOut, LayoutDashboard, UserCheck } from 'lucide-react'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL, API_DOCS_URL } from '../../utils/apiConfig'

export default function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking')
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'ok') {
            setBackendStatus('online')
            return
          }
        }
        setBackendStatus('offline')
      } catch (err) {
        setBackendStatus('offline')
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 15000)
    return () => clearInterval(interval)
  }, [])

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'UI Design System', href: '/design' },
    ...(isAuthenticated
      ? [
          { name: 'SOC Dashboard', href: '/dashboard' },
          { name: 'Live Stream', href: '/live' },
          { name: 'Network Telemetry', href: '/traffic' },
          { name: 'ML Engine', href: '/models' },
          { name: 'Threat Analytics', href: '/analytics' },
          { name: 'Forecasting & Intel', href: '/advanced' },
          { name: 'Security Alerts', href: '/alerts' },
          ...(user?.role === 'admin' ? [{ name: 'Admin Portal', href: '/admin' }] : []),
        ]
      : []),
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyber-800/80 bg-cyber-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800/80 text-cyan-400 group-hover:border-cyan-400/80 group-hover:shadow-cyber-glow transition-all">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                  NetGuard <span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                  Attack Detection & Forecasting
                </span>
              </div>
            </Link>

            {/* Live System Health Badge */}
            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-cyber-800">
              <Badge
                variant={backendStatus === 'online' ? 'low' : backendStatus === 'checking' ? 'medium' : 'critical'}
                size="sm"
                dot
              >
                API: {backendStatus === 'online' ? 'ACTIVE (PGSQL)' : backendStatus === 'checking' ? 'SYNCING...' : 'OFFLINE'}
              </Badge>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-cyan-400 font-semibold'
                      : 'text-slate-300 hover:text-slate-100'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard">
                  <Badge variant={user?.role === 'admin' ? 'critical' : 'info'} size="sm" dot>
                    {user?.name} ({user?.role})
                  </Badge>
                </Link>
                <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="secondary" size="sm" icon={LogIn}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            <a
              href={API_DOCS_URL}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm" icon={ExternalLink} iconPosition="right">
                API Docs
              </Button>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-slate-100 p-2 rounded-lg hover:bg-cyber-850"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-cyber-800 bg-cyber-900/95 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-cyber-850"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-cyber-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button variant="secondary" size="sm" icon={LogOut} onClick={logout} className="w-full">
                Sign Out ({user?.email})
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
