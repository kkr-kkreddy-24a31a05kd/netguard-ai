import React, { useState, useEffect, useRef } from 'react'
import {
  Radio,
  Play,
  Pause,
  Square,
  Activity,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Cpu,
  Layers,
  Sliders,
  Maximize2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'

const PIE_COLORS = ['#ef4444', '#06b6d4', '#a855f7', '#3b82f6', '#10b981']

export default function LiveMonitoringPage() {
  const [wsConnected, setWsConnected] = useState(false)
  const [simStatus, setSimStatus] = useState({
    state: 'STOPPED',
    flows_per_second: 2.0,
    total_generated: 0,
    attacks_generated: 0,
    is_simulated: true,
  })
  const [liveEvents, setLiveEvents] = useState([])
  const [chartData, setChartData] = useState([])
  const [protocolCounts, setProtocolCounts] = useState({ TCP: 0, UDP: 0, ICMP: 0 })
  const [latestAlert, setLatestAlert] = useState(null)
  const wsRef = useRef(null)

  const connectWebSocket = () => {
    const token = localStorage.getItem('netguard_token')
    if (!token) return

    const wsUrl = `ws://localhost:8000/api/v1/realtime/ws/live-traffic?token=${token}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setWsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'CONNECTION_ESTABLISHED') {
          if (data.simulator_status) setSimStatus(data.simulator_status)
        } else if (data.type === 'SIMULATION_STATUS_UPDATE') {
          if (data.status) setSimStatus(data.status)
        } else if (data.type === 'LIVE_FLOW_TELEMETRY') {
          handleIncomingTelemetry(data)
        }
      } catch (err) {
        console.error('Error parsing WS message:', err)
      }
    }

    ws.onclose = () => {
      setWsConnected(false)
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }
  }

  const handleIncomingTelemetry = (event) => {
    setLiveEvents((prev) => [event, ...prev.slice(0, 49)])

    if (event.alert) {
      setLatestAlert(event.alert)
    }

    const proto = event.flow?.protocol || 'TCP'
    setProtocolCounts((prev) => ({
      ...prev,
      [proto]: (prev[proto] || 0) + 1,
    }))

    const nowStr = new Date().toLocaleTimeString().slice(3, 8)
    const isAttack = event.detection?.predicted_attack !== 'Normal' && event.detection?.predicted_attack !== 'BENIGN'

    setChartData((prev) => {
      const updated = [...prev.slice(-14), {
        time: nowStr,
        rate: event.flow?.packets || 10,
        attacks: isAttack ? 1 : 0,
      }]
      return updated
    })

    setSimStatus((prev) => ({
      ...prev,
      total_generated: prev.total_generated + 1,
      attacks_generated: prev.attacks_generated + (isAttack ? 1 : 0),
    }))
  }

  useEffect(() => {
    connectWebSocket()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  const sendWsAction = (action, extra = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, ...extra }))
    } else {
      // Fallback to REST control endpoints
      const token = localStorage.getItem('netguard_token')
      fetch(`http://localhost:8000/api/v1/realtime/simulation/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(extra),
      })
    }
  }

  const protoPieData = Object.entries(protocolCounts)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v }))

  const attackRate = simStatus.total_generated > 0
    ? ((simStatus.attacks_generated / simStatus.total_generated) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="flex h-screen bg-cyber-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar activeItem="attacks" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar />

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cyber-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800 text-cyan-400">
                  <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-100">
                  Real-Time SOC Traffic & Threat Telemetry
                </h1>
                <Badge variant="cyan" size="sm">Phase 7 Live</Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Asynchronous event loop ingestion, sub-millisecond ML classification, and WebSocket broadcast.
              </p>
            </div>

            {/* Simulation Controls */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-cyber-900 border border-cyber-800">
              {simStatus.state !== 'RUNNING' ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Play}
                  onClick={() => sendWsAction(simStatus.state === 'PAUSED' ? 'resume' : 'start')}
                >
                  {simStatus.state === 'PAUSED' ? 'Resume' : 'Start Engine'}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Pause}
                  onClick={() => sendWsAction('pause')}
                >
                  Pause
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                icon={Square}
                onClick={() => sendWsAction('stop')}
                disabled={simStatus.state === 'STOPPED'}
              >
                Stop
              </Button>
            </div>
          </div>

          {/* Prominent Mandatory Simulation Label */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  simStatus.state === 'RUNNING' ? 'bg-amber-400' : 'bg-slate-500'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  simStatus.state === 'RUNNING' ? 'bg-amber-500' : 'bg-slate-600'
                }`} />
              </span>
              <div>
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                  [SIMULATED TRAFFIC ENGINE: {simStatus.state}]
                </span>
                <p className="text-[11px] text-amber-200/70 mt-0.5">
                  Notice: Generated telemetry is strictly synthetic data for SOC monitoring and evaluation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span>WS Status: </span>
              <Badge variant={wsConnected ? 'low' : 'critical'} size="xs" dot>
                {wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </Badge>
            </div>
          </div>

          {/* Key Live KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 bg-cyber-900/60 border-cyber-800">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>In-Flight Flow Rate</span>
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-400 mt-2 font-mono">
                {simStatus.state === 'RUNNING' ? `${simStatus.flows_per_second} flows/s` : '0.0 flows/s'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Total Synthesized: {simStatus.total_generated}
              </div>
            </Card>

            <Card className="p-4 bg-cyber-900/60 border-cyber-800">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Live Attack Rate</span>
                <Flame className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400 mt-2 font-mono">
                {attackRate}%
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Threat Flows: {simStatus.attacks_generated}
              </div>
            </Card>

            <Card className="p-4 bg-cyber-900/60 border-cyber-800">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Processing Latency</span>
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
                ~1.8 ms
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Async Event Pipeline
              </div>
            </Card>

            <Card className="p-4 bg-cyber-900/60 border-cyber-800">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Recent Alert Trigger</span>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-sm font-bold text-slate-200 mt-2 truncate">
                {latestAlert ? latestAlert.title : 'None active'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Severity: {latestAlert ? latestAlert.severity : 'N/A'}
              </div>
            </Card>
          </div>

          {/* Live Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                    Live Stream Flow Volumetrics
                  </h2>
                </div>
                <span className="text-xs font-mono text-cyan-400 animate-pulse">STREAMING LIVE</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
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
                    <Area
                      type="monotone"
                      dataKey="rate"
                      name="Packets / Sec"
                      stroke="#06b6d4"
                      fillOpacity={1}
                      fill="url(#rateGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 bg-cyber-900/80 border-cyber-800">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                    Stream Protocols
                  </h2>
                </div>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                {protoPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={protoPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {protoPieData.map((entry, index) => (
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
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-500 font-mono">Awaiting live traffic...</div>
                )}
              </div>
            </Card>
          </div>

          {/* Real-Time Live Feed Terminal */}
          <Card className="p-5 bg-cyber-900/80 border-cyber-800">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyber-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                  Live Flow Terminal (WebSocket Stream)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Showing last {liveEvents.length} events
              </span>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="border-b border-cyber-800 text-slate-400 sticky top-0 bg-cyber-900">
                    <th className="p-2">Timestamp</th>
                    <th className="p-2">Flow Endpoints</th>
                    <th className="p-2">Proto</th>
                    <th className="p-2">Packets</th>
                    <th className="p-2">Bytes</th>
                    <th className="p-2">ML Classification</th>
                    <th className="p-2">Confidence</th>
                    <th className="p-2">Anomaly Flag</th>
                    <th className="p-2 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-850">
                  {liveEvents.map((evt, i) => (
                    <tr key={i} className="hover:bg-cyber-850/40">
                      <td className="p-2 text-slate-400">
                        {evt.flow?.timestamp ? evt.flow.timestamp.slice(11, 19) : '00:00:00'}
                      </td>
                      <td className="p-2 text-slate-200">
                        <span className="text-cyan-400 font-bold">{evt.flow?.source_ip}</span>:{evt.flow?.source_port} → {evt.flow?.destination_ip}:{evt.flow?.destination_port}
                      </td>
                      <td className="p-2 text-slate-400">{evt.flow?.protocol}</td>
                      <td className="p-2 text-slate-300">{evt.flow?.packets?.toLocaleString()}</td>
                      <td className="p-2 text-slate-300">{evt.flow?.bytes?.toLocaleString()}</td>
                      <td className="p-2 font-bold text-slate-100">
                        {evt.detection?.predicted_attack}
                      </td>
                      <td className="p-2 text-cyan-400 font-bold">
                        {evt.detection ? `${(evt.detection.confidence * 100).toFixed(0)}%` : 'N/A'}
                      </td>
                      <td className="p-2">
                        {evt.detection?.is_anomaly ? (
                          <span className="text-red-400 font-bold">TRUE ({evt.detection.anomaly_score})</span>
                        ) : (
                          <span className="text-slate-500">FALSE</span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <Badge
                          variant={
                            evt.detection?.severity === 'CRITICAL'
                              ? 'critical'
                              : evt.detection?.severity === 'HIGH'
                              ? 'high'
                              : evt.detection?.severity === 'MEDIUM'
                              ? 'medium'
                              : 'low'
                          }
                          size="xs"
                        >
                          {evt.detection?.severity || 'LOW'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {liveEvents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 font-mono">
                        Waiting for simulation stream... Click 'Start Engine' above to begin generating live network flows.
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
