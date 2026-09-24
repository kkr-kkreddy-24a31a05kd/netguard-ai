import React, { useState, useEffect } from 'react'
import {
  BellRing,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  UserCheck,
  RefreshCw,
  Eye,
  Check,
  ShieldCheck,
  X,
  Filter,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('netguard_token')
      const headers = { Authorization: `Bearer ${token}` }

      let url = 'http://localhost:8000/api/v1/alerts?limit=50'
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`
      if (severityFilter !== 'ALL') url += `&severity=${severityFilter}`

      const [alertsRes, statsRes] = await Promise.all([
        fetch(url, { headers }),
        fetch('http://localhost:8000/api/v1/alerts/statistics', { headers }),
      ])

      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts(data.alerts || [])
      }
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
    } catch (err) {
      console.error('Failed to load alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [statusFilter, severityFilter])

  const handleAcknowledge = async (alertId) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('netguard_token')
      const res = await fetch(`http://localhost:8000/api/v1/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setFeedbackMsg(`Alert #${alertId} marked as Acknowledged.`)
        await fetchAlerts()
        if (selectedAlert?.id === alertId) {
          const updated = await res.json()
          setSelectedAlert(updated.alert)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolve = async (alertId) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('netguard_token')
      const res = await fetch(`http://localhost:8000/api/v1/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setFeedbackMsg(`Alert #${alertId} marked as Resolved.`)
        await fetchAlerts()
        if (selectedAlert?.id === alertId) {
          const updated = await res.json()
          setSelectedAlert(updated.alert)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-cyber-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar activeItem="alerts" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar />

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cyber-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-950/70 border border-red-800 text-red-400">
                  <BellRing className="w-5 h-5 text-red-400" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-100">
                  Security Incident & Alert Management
                </h1>
                <Badge variant="critical" size="sm">Phase 6 Active</Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Automated threat generation, analyst acknowledgment workflows, and auditable incident lifecycle.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchAlerts}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {feedbackMsg && (
            <div className="p-3 rounded-lg bg-cyber-900 border border-cyber-700 text-sm text-cyan-300 flex items-center justify-between">
              <span>{feedbackMsg}</span>
              <button onClick={() => setFeedbackMsg('')} className="text-xs text-slate-400 hover:text-white">Dismiss</button>
            </div>
          )}

          {/* Metric Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card className="p-3.5 bg-cyber-900/60 border-cyber-800">
              <div className="text-xs font-mono uppercase text-slate-400">Total Alerts</div>
              <div className="text-xl font-bold text-slate-100 mt-1">{stats?.total_alerts || 0}</div>
            </Card>
            <Card className="p-3.5 bg-red-950/30 border-red-900/60">
              <div className="text-xs font-mono uppercase text-red-400">Open Incidents</div>
              <div className="text-xl font-bold text-red-400 mt-1">{stats?.open_alerts || 0}</div>
            </Card>
            <Card className="p-3.5 bg-amber-950/30 border-amber-900/60">
              <div className="text-xs font-mono uppercase text-amber-400">Acknowledged</div>
              <div className="text-xl font-bold text-amber-400 mt-1">{stats?.acknowledged_alerts || 0}</div>
            </Card>
            <Card className="p-3.5 bg-emerald-950/30 border-emerald-900/60">
              <div className="text-xs font-mono uppercase text-emerald-400">Resolved</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{stats?.resolved_alerts || 0}</div>
            </Card>
            <Card className="p-3.5 bg-cyber-900/60 border-cyber-800">
              <div className="text-xs font-mono uppercase text-red-300">Critical Priority</div>
              <div className="text-xl font-bold text-red-400 mt-1">{stats?.critical_alerts || 0}</div>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="p-3.5 bg-cyber-900/80 border-cyber-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Status:</span>
              {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    statusFilter === st
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-850'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Severity:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    severityFilter === sev
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-850'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </Card>

          {/* Alerts Table */}
          <Card className="p-5 bg-cyber-900/80 border-cyber-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-cyber-800 text-slate-400">
                    <th className="p-2.5">Alert ID</th>
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5">Incident Title</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Created At</th>
                    <th className="p-2.5">Assignee / Handler</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-850">
                  {alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-cyber-850/50">
                      <td className="p-2.5 font-bold text-cyan-400">#{a.id}</td>
                      <td className="p-2.5">
                        <Badge
                          variant={
                            a.severity === 'CRITICAL'
                              ? 'critical'
                              : a.severity === 'HIGH'
                              ? 'high'
                              : 'medium'
                          }
                          size="xs"
                        >
                          {a.severity}
                        </Badge>
                      </td>
                      <td className="p-2.5 font-medium text-slate-200 max-w-sm truncate">
                        {a.title}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === 'OPEN'
                              ? 'bg-red-950/80 text-red-300 border border-red-800'
                              : a.status === 'ACKNOWLEDGED'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {new Date(a.created_at).toLocaleTimeString()}
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {a.resolved_by || a.acknowledged_by || 'Unassigned'}
                      </td>
                      <td className="p-2.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedAlert(a)}
                          className="px-2 py-1 rounded bg-cyber-800 hover:bg-cyber-700 text-slate-200 text-xs"
                          title="View Details"
                        >
                          Details
                        </button>
                        {a.status === 'OPEN' && (
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            disabled={actionLoading}
                            className="px-2 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs"
                          >
                            Ack
                          </button>
                        )}
                        {a.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolve(a.id)}
                            disabled={actionLoading}
                            className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {alerts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                        No alerts matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Alert Details Modal / Drawer */}
          {selectedAlert && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <Card className="w-full max-w-2xl bg-cyber-900 border-cyber-700 p-6 space-y-4 shadow-2xl relative">
                <div className="flex items-start justify-between pb-3 border-b border-cyber-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400">Alert #{selectedAlert.id}</span>
                      <Badge
                        variant={selectedAlert.severity === 'CRITICAL' ? 'critical' : 'high'}
                        size="xs"
                      >
                        {selectedAlert.severity}
                      </Badge>
                      <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                        [{selectedAlert.status}]
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-100 mt-1">{selectedAlert.title}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-xs text-slate-300 font-sans leading-relaxed">
                  {selectedAlert.description}
                </div>

                {selectedAlert.detection && (
                  <div className="p-3.5 rounded-lg bg-cyber-950 border border-cyber-800 space-y-2 text-xs font-mono">
                    <div className="text-cyan-400 font-bold">Detection Telemetry Context</div>
                    <div className="grid grid-cols-2 gap-2 text-slate-400">
                      <div>Attack Class: <span className="text-slate-100">{selectedAlert.detection.predicted_attack}</span></div>
                      <div>Confidence: <span className="text-slate-100">{(selectedAlert.detection.confidence * 100).toFixed(1)}%</span></div>
                      <div>Anomaly Score: <span className="text-slate-100">{selectedAlert.detection.anomaly_score}</span></div>
                      <div>Model Version: <span className="text-slate-100">{selectedAlert.detection.model_version}</span></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-cyber-800 text-xs font-mono text-slate-400">
                  <div>
                    Created: {new Date(selectedAlert.created_at).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedAlert.status === 'OPEN' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAcknowledge(selectedAlert.id)}
                        loading={actionLoading}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {selectedAlert.status !== 'RESOLVED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleResolve(selectedAlert.id)}
                        loading={actionLoading}
                      >
                        Resolve Incident
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
