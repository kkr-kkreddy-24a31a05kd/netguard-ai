import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  User,
  Key,
  Database,
  Lock,
  Activity,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Server,
  Radio,
  Cpu,
  ShieldAlert,
  BellRing,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import StatCard from '../components/feedback/StatCard'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  const modules = [
    {
      title: 'Live Stream Telemetry',
      desc: 'Real-time WebSocket event ingestion, dynamic traffic simulation, and instant anomaly detection.',
      path: '/live',
      badge: 'Phase 7 Active',
      icon: Radio,
      variant: 'cyan',
    },
    {
      title: 'Flow Telemetry Ingestion',
      desc: 'Multi-dataset network flow upload (CICIDS2017, UNSW-NB15) with automated column mapping.',
      path: '/traffic',
      badge: 'Phase 3 Active',
      icon: Database,
      variant: 'low',
    },
    {
      title: 'Dual-Stage ML Engine',
      desc: 'Supervised multi-class attack classification (RandomForest) + Isolation Forest anomaly detection.',
      path: '/models',
      badge: 'Phase 4 Active',
      icon: Cpu,
      variant: 'low',
    },
    {
      title: 'Threat Detection & Analytics',
      desc: 'Attack distribution trends, protocol susceptibility, severity tiers, and targeted host analysis.',
      path: '/analytics',
      badge: 'Phase 5 Active',
      icon: ShieldAlert,
      variant: 'critical',
    },
    {
      title: 'Incident & Alert Management',
      desc: 'Automated threat condition triggers, analyst triage, acknowledgment, and resolution workflows.',
      path: '/alerts',
      badge: 'Phase 6 Active',
      icon: BellRing,
      variant: 'high',
    },
    {
      title: 'Forecasting & Threat Intel',
      desc: 'Temporal heatmaps, recurring pattern mining, host relationship graphing, and executive reporting.',
      path: '/advanced',
      badge: 'Phase 8 Active',
      icon: Compass,
      variant: 'cyan',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-cyber-950 text-slate-100 font-sans">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar className="hidden lg:flex" activeItem="dashboard" />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-cyber-800 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={user?.role === 'admin' ? 'critical' : 'info'} dot size="sm">
                  {user?.role?.toUpperCase()} SESSION
                </Badge>
                <span className="text-xs text-slate-500 font-mono">
                  ID: #{user?.id}
                </span>
                <Badge variant="cyan" size="sm">All Phases 1–9 Unified</Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                Security Operations Command Center
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Authenticated Operator: <strong className="text-slate-200">{user?.name}</strong> ({user?.email})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" icon={LogOut} onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Database Engine"
              value="PostgreSQL 16"
              threatLevel="low"
              subtitle="Relational schema synchronized"
              icon={Database}
            />
            <StatCard
              title="Auth Protocol"
              value="JWT / HS256"
              threatLevel="low"
              subtitle="Bcrypt password hashing"
              icon={Key}
            />
            <StatCard
              title="ML Classifiers"
              value="Dual-Stage Ensembled"
              threatLevel="low"
              subtitle="RandomForest + IsolationForest"
              icon={Cpu}
            />
            <StatCard
              title="Live Engine"
              value="Async WebSocket"
              threatLevel="low"
              subtitle="Live synthetic traffic streaming"
              icon={Radio}
            />
          </div>

          {/* Core Modular Architecture Navigation Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono">
                Integrated SOC Defense Modules
              </h2>
              <span className="text-xs text-slate-500 font-mono">Phases 3–8 Fully Operational</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod, i) => {
                const Icon = mod.icon
                return (
                  <Link key={i} to={mod.path} className="group">
                    <Card className="p-5 bg-cyber-900/70 border-cyber-800 hover:border-cyan-800/80 transition-all duration-200 h-full flex flex-col justify-between group-hover:shadow-cyber-glow">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 rounded-lg bg-cyber-950 border border-cyber-800 text-cyan-400 group-hover:border-cyan-700 transition-colors">
                            <Icon className="w-5 h-5" />
                          </div>
                          <Badge variant={mod.variant} size="xs">
                            {mod.badge}
                          </Badge>
                        </div>
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          {mod.desc}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-cyber-850 flex items-center justify-between text-xs font-mono text-cyan-400 mt-4">
                        <span>Launch Module</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Security Operator Profile Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Operator Security Credentials" className="lg:col-span-2">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-3 bg-cyber-950 rounded-lg border border-cyber-800">
                    <span className="text-slate-500 block mb-1">Operator Name</span>
                    <span className="text-slate-200 font-semibold">{user?.name}</span>
                  </div>
                  <div className="p-3 bg-cyber-950 rounded-lg border border-cyber-800">
                    <span className="text-slate-500 block mb-1">Assigned Email</span>
                    <span className="text-cyan-400 font-semibold">{user?.email}</span>
                  </div>
                  <div className="p-3 bg-cyber-950 rounded-lg border border-cyber-800">
                    <span className="text-slate-500 block mb-1">Security Role</span>
                    <Badge variant={user?.role === 'admin' ? 'critical' : 'info'} size="sm">
                      {user?.role?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="p-3 bg-cyber-950 rounded-lg border border-cyber-800">
                    <span className="text-slate-500 block mb-1">Account Provisioned</span>
                    <span className="text-slate-400">{new Date(user?.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-cyber-800 text-xs text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cryptographic session verified via PostgreSQL JWT dependency</span>
                  </div>
                  <Link to="/design" className="text-cyan-400 hover:text-cyan-300">
                    Design Tokens →
                  </Link>
                </div>
              </div>
            </Card>

            <Card title="Platform Architecture Status">
              <div className="space-y-3 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Backend Engine:</span>
                  <span className="font-mono text-cyan-400">FastAPI (Python 3.11)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database:</span>
                  <span className="font-mono text-cyan-400">PostgreSQL 16 (Local)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frontend Client:</span>
                  <span className="font-mono text-cyan-400">React 18 + Vite</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Real-Time Ingestion:</span>
                  <span className="font-mono text-emerald-400">WebSocket Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Security Compliance:</span>
                  <span className="font-mono text-emerald-400">RBAC + Audit Logs</span>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
