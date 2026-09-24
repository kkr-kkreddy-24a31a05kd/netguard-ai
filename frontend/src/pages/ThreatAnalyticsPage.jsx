import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Flame,
  CheckCircle,
  RefreshCw,
  Play,
  Filter,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Cpu,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#06b6d4',
}

const PIE_COLORS = ['#ef4444', '#f97316', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#64748b']

export default function ThreatAnalyticsPage() {
  const [overview, setOverview] = useState(null)
  const [distribution, setDistribution] = useState([])
  const [severityBreakdown, setSeverityBreakdown] = useState([])
  const [trends, setTrends] = useState([])
  const [topSources, setTopSources] = useState([])
  const [topDestinations, setTopDestinations] = useState([])
  const [protocolStats, setProtocolStats] = useState([])
  const [detections, setDetections] = useState([])
  const [selectedSeverity, setSelectedSeverity] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('netguard_token')
      const headers = { Authorization: `Bearer ${token}` }

      const [
        ovRes,
        distRes,
        sevRes,
        trendRes,
        srcRes,
        dstRes,
        protoRes,
        detRes,
      ] = await Promise.all([
        fetch('http://localhost:8000/api/v1/analytics/overview', { headers }),
        fetch('http://localhost:8000/api/v1/analytics/attack-distribution', { headers }),
        fetch('http://localhost:8000/api/v1/analytics/severity-breakdown', { headers }),
        fetch('http://localhost:8000/api/v1/analytics/attack-trends', { headers }),
        fetch('http://localhost:8000/api/v1/analytics/top-sources', { headers }),
        fetch('http://localhost:8000/api/v1/analytics/top-destinations', { headers }),
        fetch('http://localhost:8000/api/v1/analytics/protocol-statistics', { headers }),
        fetch(
          `http://localhost:8000/api/v1/analytics/detections?limit=15${
            selectedSeverity !== 'ALL' ? `&severity=${selectedSeverity}` : ''
          }`,
          { headers }
        ),
      ])

      if (ovRes.ok) setOverview(await ovRes.json())
      if (distRes.ok) {
        const d = await distRes.json()
        setDistribution(d.distribution || [])
      }
      if (sevRes.ok) {
        const s = await sevRes.json()
        setSeverityBreakdown(s.breakdown || [])
      }
      if (trendRes.ok) setTrends(await trendRes.json())
      if (srcRes.ok) setTopSources(await srcRes.json())
      if (dstRes.ok) setTopDestinations(await dstRes.json())
      if (protoRes.ok) setProtocolStats(await protoRes.json())
      if (detRes.ok) {
        const detData = await detRes.json()
        setDetections(detData.detections || [])
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [selectedSeverity])

  const handleRunBatchAnalysis = async () => {
    setAnalyzing(true)
    setStatusMsg('Running ML inference & anomaly scoring on ingested flows...')
    try {
      const token = localStorage.getItem('netguard_token')
      const res = await fetch('http://localhost:8000/api/v1/analytics/analyze-batch?limit=500', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setStatusMsg(data.message || 'Batch analysis completed.')
        await fetchAnalytics()
      } else {
        setStatusMsg(data.detail || 'Analysis execution failed.')
      }
    } catch (err) {
      setStatusMsg('Network error while running batch detection.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex h-screen bg-cyber-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar activeItem="analytics" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar />

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cyber-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-950/70 border border-red-800 text-red-400">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-100">
                  Threat Detection & Security Analytics
                </h1>
                <Badge variant="critical" size="sm">Phase 5 Active</Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Unified attack classification, statistical anomaly scoring, and severity aggregation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={fetchAnalytics}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={handleRunBatchAnalysis}
                loading={analyzing}
              >
                {analyzing ? 'Classifying Flows...' : 'Analyze Pending Flows'}
              </Button>
            </div>
          </div>

          {statusMsg && (
            <div className="p-3.5 rounded-lg bg-cyber-900 border border-cyber-750 text-sm text-cyan-300 flex items-center justify-between">
              <span>{statusMsg}</span>
              <button onClick={() => setStatusMsg('')} className="text-xs text-slate-400 hover:text-white">Dismiss</button>
            </div>
          )}

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-cyber-900/60 border-cyber-800">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Total Classified</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-2">
                {(overview?.total_detections || 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                Ingested Flows: {(overview?.total_flows || 0).toLocaleString()}
              </div>
            </Card>

            <Card className="p-4 bg-cyber-900/60 border-cyber-800">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Critical Threats</span>
                <Flame className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400 mt-2">
                {overview?.critical_count || 0}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                High Priority: {overview?.high_count || 0}
              </div>
            </Card>

            <Card className="p-4 bg-cyber-900/60 border-cyber-800">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Attack Ratio</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-2">
                {overview ? `${(overview.attack_rate * 100).toFixed(1)}%` : '0.0%'}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                Attacks: {overview?.attack_count || 0}
              </div>
            </Card>

            <Card className="p-4 bg-cyber-900/60 border-cyber-800">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Anomalies Flagged</span>
                <AlertTriangle className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400 mt-2">
                {overview?.anomaly_count || 0}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                Anomaly Rate: {overview ? `${(overview.anomaly_rate * 100).toFixed(1)}%` : '0.0%'}
              </div>
            </Card>
          </div>

          {/* Charts Row 1: Attack Trend & Severity Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area Chart: Attacks vs Benign vs Anomalies */}
            <Card className="lg:col-span-2 p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                    Attack & Anomaly Trends Over Time
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">Time-series window</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attackGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="benignGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="attacks"
                      name="Malicious Flows"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#attackGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="benign"
                      name="Normal Flows"
                      stroke="#06b6d4"
                      fillOpacity={1}
                      fill="url(#benignGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="anomalies"
                      name="Anomalies"
                      stroke="#eab308"
                      fillOpacity={1}
                      fill="url(#anomalyGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Severity Breakdown Bar Chart */}
            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                    Severity Distribution
                  </h2>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="severity" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" name="Flow Count">
                      {severityBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SEVERITY_COLORS[entry.severity] || '#3b82f6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Charts Row 2: Attack Distribution Pie & Protocol Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attack Category Donut */}
            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                    Classified Attack Categories
                  </h2>
                </div>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                {distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {distribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#1e293b',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-500 font-mono">No attack data logged.</div>
                )}
              </div>
            </Card>

            {/* Protocol Distribution Stacked Bar */}
            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                    Protocol Attack Susceptibility
                  </h2>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={protocolStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="protocol" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="attack_flows" name="Malicious" fill="#ef4444" stackId="a" />
                    <Bar dataKey="benign_flows" name="Benign" fill="#06b6d4" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Top Sources & Destinations Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Top Malicious Source IPs
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Threat Origins</span>
              </div>
              <div className="space-y-2">
                {topSources.slice(0, 5).map((src, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-cyber-950/60 border border-cyber-850">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{src.source_ip}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400 font-mono">{src.attacks_count} attacks</span>
                      <span className="text-[11px] text-slate-500 font-mono">({src.total_flows} flows)</span>
                    </div>
                  </div>
                ))}
                {topSources.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-500 font-mono">No host telemetry found.</div>
                )}
              </div>
            </Card>

            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Top Targeted Destination IPs
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Assets Under Threat</span>
              </div>
              <div className="space-y-2">
                {topDestinations.slice(0, 5).map((dst, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-cyber-950/60 border border-cyber-850">
                    <span className="text-xs font-mono text-slate-200">{dst.destination_ip}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400 font-mono">{dst.attacks_count} targeted</span>
                      <span className="text-[11px] text-slate-500 font-mono">({dst.total_flows} flows)</span>
                    </div>
                  </div>
                ))}
                {topDestinations.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-500 font-mono">No host telemetry found.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Recent Detections Live Stream */}
          <Card className="p-5 bg-cyber-900/80 border-cyber-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-cyber-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                  Recent Detections & ML Telemetry
                </h2>
              </div>

              {/* Severity Filter Tabs */}
              <div className="flex items-center gap-1.5">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      selectedSeverity === sev
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-850'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-cyber-800 text-slate-400">
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5">Predicted Attack</th>
                    <th className="p-2.5">Confidence</th>
                    <th className="p-2.5">Anomaly Score</th>
                    <th className="p-2.5">Endpoints</th>
                    <th className="p-2.5">Model</th>
                    <th className="p-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-850">
                  {detections.map((d) => (
                    <tr key={d.id} className="hover:bg-cyber-850/50">
                      <td className="p-2.5">
                        <Badge
                          variant={
                            d.severity === 'CRITICAL'
                              ? 'critical'
                              : d.severity === 'HIGH'
                              ? 'high'
                              : d.severity === 'MEDIUM'
                              ? 'medium'
                              : 'low'
                          }
                          size="xs"
                        >
                          {d.severity}
                        </Badge>
                      </td>
                      <td className="p-2.5 font-bold text-slate-200">
                        {d.predicted_attack}
                      </td>
                      <td className="p-2.5 text-cyan-400 font-bold">
                        {(d.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="p-2.5">
                        <span className={d.is_anomaly ? 'text-red-400 font-bold' : 'text-slate-400'}>
                          {d.anomaly_score.toFixed(4)} {d.is_anomaly && '(FLAG)'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400 truncate max-w-[180px]">
                        {d.flow ? `${d.flow.source_ip}:${d.flow.source_port} → ${d.flow.destination_ip}:${d.flow.destination_port}` : 'N/A'}
                      </td>
                      <td className="p-2.5 text-slate-500">
                        {d.model_version}
                      </td>
                      <td className="p-2.5 text-slate-500">
                        {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {detections.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                        No detections recorded for the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
