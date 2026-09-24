import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Lock, Mail, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Card from '../components/common/Card'
import Alert from '../components/common/Alert'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('analyst')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must contain at least 8 characters')
      return
    }

    setLoading(true)

    try {
      await register(name, email, password, role)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-950 px-4 py-12 cyber-grid">
      <div className="max-w-md w-full space-y-8">
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
            Create Security Account
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Provision analyst or administrator role for network telemetry intelligence.
          </p>
        </div>

        <Card className="shadow-cyber">
          {error && (
            <Alert
              variant="error"
              title="Registration Error"
              message={error}
              className="mb-4"
              onClose={() => setError(null)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Operator Full Name"
              type="text"
              required
              icon={User}
              placeholder="e.g. Sarah Connor"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Operator Work Email"
              type="email"
              required
              icon={Mail}
              placeholder="operator@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password (min. 8 characters)"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Security Role Assignment
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full rounded-lg bg-cyber-950/80 border border-cyber-800 text-slate-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="analyst">Security Analyst (Flow Inspection & Analytics)</option>
                <option value="admin">Security Administrator (Full System & User Control)</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
              iconPosition="right"
            >
              Register & Sign In
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
