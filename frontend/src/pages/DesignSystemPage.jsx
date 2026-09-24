import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  ArrowLeft,
  Activity,
  Zap,
  Lock,
  Search,
  Key,
  Database,
  Radio,
  BarChart2,
  AlertTriangle,
  Flame,
  CheckCircle,
  Eye,
  RefreshCw,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import Alert from '../components/common/Alert'
import StatCard from '../components/feedback/StatCard'
import ChartCard from '../components/feedback/ChartCard'
import Table from '../components/feedback/Table'
import LoadingState from '../components/feedback/LoadingState'
import EmptyState from '../components/feedback/EmptyState'

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard')
  const [inputValue, setInputValue] = useState('')

  // Sample network telemetry flow data for Table component demo
  const sampleFlowData = [
    {
      id: 101,
      source_ip: '192.168.1.104',
      dest_ip: '10.0.0.15',
      port: '443 (HTTPS)',
      protocol: 'TCP',
      packets: 412,
      prediction: 'Normal',
      severity: 'low',
    },
    {
      id: 102,
      source_ip: '45.133.1.88',
      dest_ip: '10.0.0.8',
      port: '22 (SSH)',
      protocol: 'TCP',
      packets: 2840,
      prediction: 'Brute Force',
      severity: 'high',
    },
    {
      id: 103,
      source_ip: '185.220.101.5',
      dest_ip: '10.0.0.2',
      port: '80 (HTTP)',
      protocol: 'TCP',
      packets: 68100,
      prediction: 'SYN Flood DDoS',
      severity: 'critical',
    },
    {
      id: 104,
      source_ip: '192.168.1.55',
      dest_ip: '192.168.1.254',
      port: '53 (DNS)',
      protocol: 'UDP',
      packets: 18,
      prediction: 'Anomaly: Tunneling',
      severity: 'medium',
    },
  ]

  const tableColumns = [
    { key: 'source_ip', title: 'Source IP', mono: true },
    { key: 'dest_ip', title: 'Destination IP', mono: true },
    { key: 'port', title: 'Target Port' },
    { key: 'protocol', title: 'Protocol' },
    {
      key: 'packets',
      title: 'Packets',
      align: 'right',
      mono: true,
      render: (val) => Number(val).toLocaleString(),
    },
    {
      key: 'prediction',
      title: 'ML Classification',
      render: (val, row) => (
        <Badge variant={row.severity} dot size="sm">
          {val}
        </Badge>
      ),
    },
    {
      key: 'severity',
      title: 'Severity Level',
      render: (val) => (
        <span className="uppercase text-[11px] font-bold font-mono">
          {val}
        </span>
      ),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-cyber-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-cyber-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/" className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
              Cybersecurity UI Design System
              <Badge variant="info" size="sm">13 Core Components</Badge>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Reusable dark-mode components engineered with high contrast, threat severity semantics, and telemetry readability.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
              Test Modal Trigger
            </Button>
          </div>
        </div>

        {/* 1. BUTTONS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
              01. Button Component & Variants
            </h2>
            <Badge variant="default" size="sm">common/Button.jsx</Badge>
          </div>
          <Card>
            <div className="space-y-6">
              <div>
                <p className="text-xs text-slate-400 mb-3">Variants & Semantic Styling:</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary (Cyan)</Button>
                  <Button variant="secondary">Secondary (Slate)</Button>
                  <Button variant="outline">Outline (Ghost Border)</Button>
                  <Button variant="danger">Danger / Critical (Rose)</Button>
                  <Button variant="ghost">Ghost Button</Button>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-3">Sizes, Icons & States:</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" icon={ShieldAlert}>Small Action</Button>
                  <Button size="md" icon={Activity}>Medium Default</Button>
                  <Button size="lg" icon={Zap}>Large CTA</Button>
                  <Button loading>Analyzing...</Button>
                  <Button disabled>Disabled State</Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 2. BADGES & THREAT SEVERITY */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
              02. Badge & Threat Severity Indicators
            </h2>
            <Badge variant="default" size="sm">common/Badge.jsx</Badge>
          </div>
          <Card>
            <div className="space-y-6">
              <div>
                <p className="text-xs text-slate-400 mb-3">Threat Severity Levels (LOW, MEDIUM, HIGH, CRITICAL):</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="low" dot>LOW SEVERITY</Badge>
                  <Badge variant="medium" dot>MEDIUM SEVERITY</Badge>
                  <Badge variant="high" dot>HIGH SEVERITY</Badge>
                  <Badge variant="critical" dot>CRITICAL THREAT</Badge>
                  <Badge variant="info" dot>INFO / SYSTEM</Badge>
                  <Badge variant="normal">NORMAL / BENIGN</Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-3">Badge Sizes:</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="info" size="sm">Small Tag</Badge>
                  <Badge variant="info" size="md">Medium Tag</Badge>
                  <Badge variant="info" size="lg">Large Header Tag</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. INPUT FIELDS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
              03. Form & Filter Inputs
            </h2>
            <Badge variant="default" size="sm">common/Input.jsx</Badge>
          </div>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Search Network Flows"
                placeholder="e.g. 192.168.1.1 or TCP"
                icon={Search}
                helperText="Filter by IP, port, or protocol"
              />
              <Input
                label="Destination Port Range"
                placeholder="1 - 65535"
                defaultValue="443"
              />
              <Input
                label="CIDR Subnet Filter"
                placeholder="10.0.0.0/24"
                error="Invalid subnet notation detected"
              />
            </div>
          </Card>
        </section>

        {/* 4. STAT CARDS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
              04. StatCard Metrics
            </h2>
            <Badge variant="default" size="sm">feedback/StatCard.jsx</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Telemetry Flows"
              value="1,492,804"
              change="+14.2%"
              changeType="positive"
              icon={Activity}
              threatLevel="low"
              subtitle="Buffered in last 15 minutes"
            />
            <StatCard
              title="Port Scan Probes"
              value="842"
              change="+5.1%"
              changeType="negative"
              icon={AlertTriangle}
              threatLevel="medium"
              subtitle="Reconnaissance detected"
            />
            <StatCard
              title="Classified Attacks"
              value="129"
              change="-2.4%"
              changeType="positive"
              icon={ShieldAlert}
              threatLevel="high"
              subtitle="Supervised ML matches"
            />
            <StatCard
              title="Critical Active Alerts"
              value="18"
              change="+8"
              changeType="negative"
              icon={Flame}
              threatLevel="critical"
              subtitle="Requires immediate SOC review"
            />
          </div>
        </section>

        {/* 5. ALERTS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
              05. Security Alert Notifications
            </h2>
            <Badge variant="default" size="sm">common/Alert.jsx</Badge>
          </div>
          <div className="space-y-3">
            <Alert
              variant="critical"
              title="CRITICAL: Volumetric SYN Flood Detected on DMZ Gateway"
              message="Ingress flow rate on 10.0.0.2 exceeds 85,000 packets/sec. Model confidence: 99.4%."
              onClose={() => {}}
            />
            <Alert
              variant="warning"
              title="WARNING: High-Frequency Port Scan From Untrusted Subnet"
              message="IP 45.133.1.88 contacted 1,200 unique ports across 14 host addresses within 8 seconds."
            />
            <Alert
              variant="info"
              title="INFO: Model Pipeline Synchronized"
              message="ML Detection Engine is actively monitoring live simulated traffic buffer."
            />
          </div>
        </section>

        {/* 6. TELEMETRY TABLE */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
              06. Network Telemetry Table
            </h2>
            <Badge variant="default" size="sm">feedback/Table.jsx</Badge>
          </div>
          <Table
            columns={tableColumns}
            data={sampleFlowData}
            onRowClick={(row) => alert(`Selected Flow #${row.id} from ${row.source_ip}`)}
          />
        </section>

        {/* 7. CHART CARDS & SIDEBAR PREVIEW */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
                07. ChartCard Container
              </h2>
              <Badge variant="default" size="sm">feedback/ChartCard.jsx</Badge>
            </div>
            <ChartCard
              title="Ingress Traffic Volume & Anomaly Spikes"
              subtitle="Simulated packet volume over 60-second sliding window"
              badge={<Badge variant="info" size="sm">Live Feed</Badge>}
              footerInfo="Telemetry Source: CICIDS2017 Preprocessed Stream"
              height="h-56"
            >
              {/* Synthetic visual representation for Phase 1 preview */}
              <div className="w-full h-full flex items-end gap-2 px-4 pb-2 border-b border-cyber-800/80">
                {[45, 60, 52, 78, 65, 89, 95, 120, 80, 70, 92, 140, 110, 85, 90, 75, 68].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      style={{ height: `${(h / 140) * 100}%` }}
                      className={`w-full rounded-t transition-all ${
                        h > 100
                          ? 'bg-rose-500/80 hover:bg-rose-400'
                          : h > 85
                          ? 'bg-amber-500/80 hover:bg-amber-400'
                          : 'bg-cyan-500/70 hover:bg-cyan-400'
                      }`}
                      title={`Timestamp T+${i}s: ${h * 120} pkts/s`}
                    />
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
                08. SOC Sidebar Component
              </h2>
              <Badge variant="default" size="sm">layout/Sidebar.jsx</Badge>
            </div>
            <div className="h-[320px] rounded-xl overflow-hidden border border-cyber-800">
              <Sidebar
                activeItem={activeSidebarItem}
                onItemSelect={(id) => setActiveSidebarItem(id)}
                className="h-full w-full"
              />
            </div>
          </div>
        </section>

        {/* 8. LOADING & EMPTY STATES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
              09. LoadingState & EmptyState Components
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">feedback/LoadingState.jsx</Badge>
              <Badge variant="default" size="sm">feedback/EmptyState.jsx</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Radar Telemetry Scanner">
              <LoadingState variant="radar" text="Probing network flows for anomalies..." />
            </Card>
            <Card title="Zero Threats Empty State">
              <EmptyState
                title="Telemetry Buffer Clean"
                description="No anomalous or malicious packets detected within the selected capture window."
                action={<Button variant="outline" size="sm">Refresh Ingestion</Button>}
              />
            </Card>
          </div>
        </section>

        {/* MODAL DEMONSTRATION */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Network Flow Deep Inspection"
          description="Detailed telemetry metrics for Packet ID #103"
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                Dismiss
              </Button>
              <Button variant="danger" size="sm" onClick={() => setModalOpen(false)}>
                Flag as False Positive
              </Button>
            </>
          }
        >
          <div className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 bg-cyber-950 rounded-lg border border-cyber-800">
              <div><span className="text-slate-500">Source:</span> 185.220.101.5:49152</div>
              <div><span className="text-slate-500">Destination:</span> 10.0.0.2:80</div>
              <div><span className="text-slate-500">Protocol:</span> TCP (SYN=1, ACK=0)</div>
              <div><span className="text-slate-500">Duration:</span> 0.042 ms</div>
              <div><span className="text-slate-500">Prediction:</span> SYN Flood DDoS</div>
              <div><span className="text-slate-500">Confidence:</span> 99.4%</div>
            </div>
            <p className="text-slate-400 text-xs font-sans">
              Flow displays high-velocity SYN packets with zero ACK completions matching TCP SYN flood signatures.
            </p>
          </div>
        </Modal>
      </main>
    </div>
  )
}
