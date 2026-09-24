import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Shield, Lock, Mail, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Card from '../components/common/Card'
import Alert from '../components/common/Alert'
import Badge from '../components/common/Badge'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-950 px-4 py-12 cyber-grid">
      <div className="max-w-md w-full space-y-8">
        {/* Brand header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 group-hover:border-cyan-400 transition-all shadow-cyber-sm">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-xl font-bold text-slate-100 tracking-tight">
              NetGuard <span className="text-cyan-400">AI</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Security Operations Sign In
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Authenticate to access live telemetry, attack classifications, and alert directives.
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-cyber">
          {error && (
            <Alert
              variant="error"
              title="Authentication Error"
              message={error}
              className="mb-4"
              onClose={() => setError(null)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Operator Email"
              type="email"
              required
              icon={Mail}
              placeholder="operator@netguard.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Secret Key / Password"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
              iconPosition="right"
            >
              Authenticate Session
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-cyber-800">
            <p className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-2.5 flex items-center justify-between">
              <span>Seeded Security Accounts</span>
              <Badge variant="low" size="sm">Active</Badge>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@netguard.ai', 'Admin@NetGuard2026!')}
                className="p-2 rounded-lg bg-cyber-950/80 border border-cyber-800 hover:border-cyan-500/60 text-left transition-all text-xs group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Admin
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                  admin@netguard.ai
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('analyst@netguard.ai', 'Analyst@NetGuard2026!')}
                className="p-2 rounded-lg bg-cyber-950/80 border border-cyber-800 hover:border-cyan-500/60 text-left transition-all text-xs group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  Analyst
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                  analyst@netguard.ai
                </div>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Need a new operator account?{' '}
          <Link to="/register" className="font-medium text-cyan-400 hover:text-cyan-300">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
