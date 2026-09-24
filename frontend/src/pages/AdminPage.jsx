import React, { useState, useEffect } from 'react'
import {
  Shield,
  Users,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import Input from '../components/common/Input'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('users') // 'users', 'audit', 'config'
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [config, setConfig] = useState({
    anomaly_threshold: 0.35,
    critical_confidence_threshold: 0.8,
    high_confidence_threshold: 0.6,
    auto_alert_enabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [errMsg, setErrMsg] = useState('')

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('netguard_token')
      const headers = { Authorization: `Bearer ${token}` }

      const [usersRes, auditRes, cfgRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/admin/users', { headers }),
        fetch('http://localhost:8000/api/v1/admin/audit-logs?limit=50', { headers }),
        fetch('http://localhost:8000/api/v1/admin/system-config', { headers }),
      ])

      if (usersRes.ok) {
        const u = await usersRes.json()
        setUsers(u.users || [])
      }
      if (auditRes.ok) {
        const a = await auditRes.json()
        setAuditLogs(a.logs || [])
      }
      if (cfgRes.ok) {
        setConfig(await cfgRes.json())
      }
    } catch (err) {
      console.error(err)
      setErrMsg('Failed to load administrator data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    setErrMsg('')
    try {
      const token = localStorage.getItem('netguard_token')
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        setMsg(`User role successfully changed to ${newRole}.`)
        await fetchAdminData()
      } else {
        const d = await res.json()
        setErrMsg(d.detail || 'Role update failed.')
      }
    } catch (err) {
      setErrMsg('Error updating user role.')
    }
  }

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}?`)) return
    setErrMsg('')
    try {
      const token = localStorage.getItem('netguard_token')
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setMsg(`User ${userEmail} deleted.`)
        await fetchAdminData()
      } else {
        const d = await res.json()
        setErrMsg(d.detail || 'Deletion failed.')
      }
    } catch (err) {
      setErrMsg('Error deleting user.')
    }
  }

  const handleConfigUpdate = async (e) => {
    e.preventDefault()
    setErrMsg('')
    try {
      const token = localStorage.getItem('netguard_token')
      const res = await fetch('http://localhost:8000/api/v1/admin/system-config', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setMsg('System thresholds saved and deployed.')
        await fetchAdminData()
      } else {
        setErrMsg('Failed to update config.')
      }
    } catch (err) {
      setErrMsg('Error updating config.')
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex h-screen bg-cyber-950 text-slate-100 font-sans">
        <Sidebar activeItem="settings" />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="p-12 text-center space-y-3">
            <Lock className="w-12 h-12 text-red-400 mx-auto" />
            <h1 className="text-xl font-bold text-slate-100">Access Restricted</h1>
            <p className="text-sm text-slate-400">
              Administrative functions require an account with 'admin' RBAC privileges.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-cyber-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar activeItem="settings" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar />

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cyber-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800 text-cyan-400">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-100">
                  Administration & Security Governance
                </h1>
                <Badge variant="cyan" size="sm">Admin Portal</Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                User RBAC assignment, immutable compliance audit trails, and global detection thresholds.
              </p>
            </div>

            <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAdminData}>
              Refresh
            </Button>
          </div>

          {msg && (
            <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs flex items-center justify-between">
              <span>{msg}</span>
              <button onClick={() => setMsg('')} className="hover:text-white">Dismiss</button>
            </div>
          )}

          {errMsg && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center justify-between">
              <span>{errMsg}</span>
              <button onClick={() => setErrMsg('')} className="hover:text-white">Dismiss</button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-cyber-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono border-b-2 font-bold transition-colors ${
                activeTab === 'users'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" /> User RBAC ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono border-b-2 font-bold transition-colors ${
                activeTab === 'audit'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Audit Logs ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono border-b-2 font-bold transition-colors ${
                activeTab === 'config'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" /> System Thresholds
            </button>
          </div>

          {/* Tab 1: User Management */}
          {activeTab === 'users' && (
            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-cyber-800 text-slate-400">
                      <th className="p-2.5">User ID</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Created At</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-850">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-cyber-850/50">
                        <td className="p-2.5 font-bold text-cyan-400">#{u.id}</td>
                        <td className="p-2.5 font-semibold text-slate-200">{u.name}</td>
                        <td className="p-2.5 text-slate-400">{u.email}</td>
                        <td className="p-2.5">
                          <Badge variant={u.role === 'admin' ? 'critical' : 'info'} size="xs">
                            {u.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-slate-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-2.5 text-right space-x-2">
                          <button
                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'analyst' : 'admin')}
                            className="px-2 py-1 rounded bg-cyber-800 hover:bg-cyber-700 text-slate-200 text-xs"
                          >
                            Switch to {u.role === 'admin' ? 'Analyst' : 'Admin'}
                          </button>
                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tab 2: Security Audit Logs */}
          {activeTab === 'audit' && (
            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-cyber-800 text-slate-400">
                      <th className="p-2.5">Log ID</th>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Actor</th>
                      <th className="p-2.5">Target</th>
                      <th className="p-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-850">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-cyber-850/50">
                        <td className="p-2.5 text-cyan-400">#{log.id}</td>
                        <td className="p-2.5 text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyber-800 text-cyan-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300">{log.user_email}</td>
                        <td className="p-2.5 text-slate-300">{log.target || 'N/A'}</td>
                        <td className="p-2.5 text-slate-400 max-w-xs truncate">{log.details}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                          No audit trail events recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tab 3: System Thresholds Config */}
          {activeTab === 'config' && (
            <Card className="p-6 bg-cyber-900/80 border-cyber-800 max-w-2xl">
              <form onSubmit={handleConfigUpdate} className="space-y-4">
                <Input
                  label="Anomaly Score Threshold (Outlier Detection)"
                  type="number"
                  step="0.01"
                  value={config.anomaly_threshold}
                  onChange={(e) => setConfig({ ...config, anomaly_threshold: parseFloat(e.target.value) || 0 })}
                  helperText="Flows exceeding this score are flagged as statistical anomalies."
                />
                <Input
                  label="Critical Threat Confidence Threshold"
                  type="number"
                  step="0.01"
                  value={config.critical_confidence_threshold}
                  onChange={(e) => setConfig({ ...config, critical_confidence_threshold: parseFloat(e.target.value) || 0 })}
                  helperText="Minimum classifier confidence for CRITICAL severity rating."
                />
                <Input
                  label="High Threat Confidence Threshold"
                  type="number"
                  step="0.01"
                  value={config.high_confidence_threshold}
                  onChange={(e) => setConfig({ ...config, high_confidence_threshold: parseFloat(e.target.value) || 0 })}
                />
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="autoAlert"
                    checked={config.auto_alert_enabled}
                    onChange={(e) => setConfig({ ...config, auto_alert_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-cyber-700 bg-cyber-950 text-cyan-500"
                  />
                  <label htmlFor="autoAlert" className="text-xs text-slate-300 font-mono">
                    Auto-generate Security Alerts for CRITICAL / HIGH incidents
                  </label>
                </div>
                <div className="pt-3 border-t border-cyber-800">
                  <Button type="submit" variant="primary" size="sm">
                    Save Configuration
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
