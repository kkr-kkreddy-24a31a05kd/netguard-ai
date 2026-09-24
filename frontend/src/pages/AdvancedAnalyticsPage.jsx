import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Flame,
  FileDown,
  Clock,
  Compass,
  Database,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Info,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

export default function AdvancedAnalyticsPage() {
  const [timeline, setTimeline] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [patterns, setPatterns] = useState([])
  const [relationships, setRelationships] = useState([])
  const [intel, setIntel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchAdvancedData = async () => {
    try {
      const token = localStorage.getItem('netguard_token')
      const headers = { Authorization: `Bearer ${token}` }

      const [tlRes, hmRes, patRes, relRes, intelRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/advanced-analytics/timeline?hours=24', { headers }),
        fetch('http://localhost:8000/api/v1/advanced-analytics/heatmap', { headers }),
        fetch('http://localhost:8000/api/v1/advanced-analytics/patterns', { headers }),
        fetch('http://localhost:8000/api/v1/advanced-analytics/relationships?limit=8', { headers }),
        fetch('http://localhost:8000/api/v1/advanced-analytics/intel', { headers }),
      ])

      if (tlRes.ok) setTimeline(await tlRes.json())
      if (hmRes.ok) setHeatmap(await hmRes.json())
      if (patRes.ok) setPatterns(await patRes.json())
      if (relRes.ok) setRelationships(await relRes.json())
      if (intelRes.ok) setIntel(await intelRes.json())
    } catch (err) {
      console.error('Error fetching advanced analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdvancedData()
  }, [])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('netguard_token')
      const res = await fetch('http://localhost:8000/api/v1/advanced-analytics/report/csv?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `netguard_threat_report_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const handleExportJSON = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('netguard_token')
      const res = await fetch('http://localhost:8000/api/v1/advanced-analytics/report/json', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `netguard_executive_report_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-screen bg-cyber-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar activeItem="anomalies" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar />

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cyber-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800 text-cyan-400">
                  <Compass className="w-5 h-5 text-cyan-400" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-100">
                  Advanced Threat Intelligence & Pattern Mining
                </h1>
                <Badge variant="cyan" size="sm">Phase 8 Active</Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Historical temporal correlation, recurring attack pattern mining, and host relationship mapping.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={fetchAdvancedData}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={FileDown}
                onClick={handleExportCSV}
                loading={exporting}
              >
                Export CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={FileDown}
                onClick={handleExportJSON}
                loading={exporting}
              >
                Executive Report
              </Button>
            </div>
          </div>

          {/* Section 1: 24-Hour Threat Timeline & Attack Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                    24-Hour Threat Timeline by Severity
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">Hourly Stack</span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="critical" name="Critical" fill="#ef4444" stackId="a" />
                    <Bar dataKey="high" name="High" fill="#f97316" stackId="a" />
                    <Bar dataKey="medium" name="Medium" fill="#eab308" stackId="a" />
                    <Bar dataKey="low" name="Low" fill="#06b6d4" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Diurnal Attack Heatmap */}
            <Card className="p-5 bg-cyber-900/80 border-cyber-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                      Diurnal Attack Intensity Heatmap
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-400">24-Hour Distribution</span>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 pt-2">
                  {heatmap.map((h, i) => {
                    const intensityColor =
                      h.intensity > 40
                        ? 'bg-red-600 text-white'
                        : h.intensity > 15
                        ? 'bg-amber-600 text-white'
                        : h.intensity > 3
                        ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-700'
                        : 'bg-cyber-950 text-slate-500 border border-cyber-850'

                    return (
                      <div
                        key={i}
                        className={`p-2 rounded text-center transition-all ${intensityColor}`}
                        title={`${h.hour}: ${h.intensity} attacks recorded`}
                      >
                        <div className="text-[10px] font-mono opacity-80">{h.hour}</div>
                        <div className="text-xs font-bold font-mono mt-0.5">{h.intensity}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-3 border-t border-cyber-850 mt-4">
                <span>Color Scale: Low (Dark) → Moderate (Cyan) → Elevated (Amber) → Critical (Red)</span>
              </div>
            </Card>
          </div>

          {/* Section 2: Recurring Attack Patterns & Communication Relationships */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recurring Patterns */}
            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                    Mined Recurring Attack Patterns
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">Behavioral Signatures</span>
              </div>

              <div className="space-y-3">
                {patterns.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-cyber-950/70 border border-cyber-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-red-300">{p.pattern_type}</span>
                      <Badge variant="high" size="xs">{p.incident_frequency} Incidents</Badge>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Source Host: <span className="text-cyan-400 font-bold">{p.source_ip}</span> • Avg Duration: {p.average_duration_sec}s
                    </div>
                    <p className="text-[11px] text-slate-400 italic">
                      Action: {p.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Source - Destination Host Relationships */}
            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-800">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                    Source → Destination Traffic Edges
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">Host Correlation</span>
              </div>

              <div className="space-y-2">
                {relationships.map((rel, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-cyber-950/60 border border-cyber-850 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-cyan-400 font-semibold">{rel.source}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-100 font-semibold">{rel.target}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-800 text-slate-400">
                        {rel.protocol}
                      </span>
                    </div>

                    <div className="text-slate-400">
                      <span className="text-slate-200 font-bold">{rel.flows}</span> flows ({(rel.bytes_transferred / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Section 3: Curated Threat Intelligence Framework (With Clear Demo Disclaimer) */}
          <Card className="p-5 bg-cyber-900/80 border-cyber-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-cyber-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                  Threat Intelligence & IOC Correlation Feed
                </h2>
              </div>
              <Badge variant="medium" size="xs">
                {intel?.source || 'DEMO_SYNTHETIC_INTEL_FEED'}
              </Badge>
            </div>

            <div className="p-2.5 rounded bg-cyber-950 border border-cyber-850 mb-3 text-xs text-amber-300/80 font-mono">
              Notice: The following Indicators of Compromise (IOCs) are synthetic intelligence records provided for cyber simulation and training purposes.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-cyber-800 text-slate-400">
                    <th className="p-2.5">Indicator / Target</th>
                    <th className="p-2.5">Classification</th>
                    <th className="p-2.5">Threat Actor Attribution</th>
                    <th className="p-2.5">Associated Vulnerability</th>
                    <th className="p-2.5 text-right">Recommended Countermeasure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-850">
                  {intel?.indicators?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-cyber-850/50">
                      <td className="p-2.5 font-bold text-cyan-400">{item.indicator}</td>
                      <td className="p-2.5 text-slate-200">{item.classification}</td>
                      <td className="p-2.5 text-purple-400 font-semibold">{item.threat_actor}</td>
                      <td className="p-2.5 text-amber-400">{item.associated_cve}</td>
                      <td className="p-2.5 text-slate-300 text-right">{item.recommended_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
