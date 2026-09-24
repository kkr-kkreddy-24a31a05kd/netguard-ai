import React from 'react'
import { Link } from 'react-router-dom'
import { API_DOCS_URL } from '../utils/apiConfig'
import {
  ShieldAlert,
  Activity,
  Cpu,
  Radio,
  BarChart3,
  BellRing,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Zap,
  Server,
  Database,
  Code2,
  Terminal,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import Card from '../components/common/Card'

export default function LandingPage() {
  const coreFeatures = [
    {
      title: 'Network Threat Detection',
      icon: ShieldAlert,
      badge: 'Threat Engine',
      description:
        'Continuous deep inspection of IP packets, protocol flags, and bi-directional flow durations to flag suspicious ingress/egress patterns.',
      accent: 'border-l-cyan-500',
    },
    {
      title: 'AI-Based Anomaly Detection',
      icon: Cpu,
      badge: 'Unsupervised ML',
      description:
        'Isolation Forest and statistical scoring to flag zero-day deviations and abnormal volumetric spikes without requiring predefined signatures.',
      accent: 'border-l-indigo-500',
    },
    {
      title: 'Attack Classification',
      icon: Lock,
      badge: 'Multi-Class Model',
      description:
        'Trained multi-class classifiers mapping traffic signatures to verified threat classes (DoS/DDoS, Brute Force, Botnets, Port Scans, Web Attacks).',
      accent: 'border-l-rose-500',
    },
    {
      title: 'Real-Time Monitoring',
      icon: Radio,
      badge: 'Live Telemetry',
      description:
        'Low-latency flow streaming architecture designed to monitor packet rates, byte volumes, and protocol activity with near-instantaneous feedback.',
      accent: 'border-l-cyan-500',
    },
    {
      title: 'Security Analytics',
      icon: BarChart3,
      badge: 'Telemetry Analytics',
      description:
        'Comprehensive SOC-level telemetry dashboards tracking top malicious source IPs, target destination vulnerabilities, and attack vectors over time.',
      accent: 'border-l-amber-500',
    },
    {
      title: 'Threat Alerts',
      icon: BellRing,
      badge: 'Early Warning',
      description:
        'Deterministic, explainable threat scoring system providing actionable warnings categorized by severity: LOW, MEDIUM, HIGH, and CRITICAL.',
      accent: 'border-l-emerald-500',
    },
  ]

  const workflowSteps = [
    {
      step: '01',
      title: 'Collect Network Data',
      description:
        'Ingest raw bi-directional network flow telemetry, extracting critical packet metrics, byte rates, duration, and protocol headers.',
      icon: Radio,
    },
    {
      step: '02',
      title: 'Analyze Traffic with AI',
      description:
        'Execute standardized preprocessing pipelines, normalizing numerical flow features and screening categorical protocol flags.',
      icon: Cpu,
    },
    {
      step: '03',
      title: 'Detect and Classify Threats',
      description:
        'Pass features through dual ML engines: supervised multi-class classification and unsupervised anomaly isolation.',
      icon: ShieldAlert,
    },
    {
      step: '04',
      title: 'Generate Security Insights',
      description:
        'Synthesize findings into transparent threat scores, real-time alert queues, and high-impact mitigation telemetry for SOC analysts.',
      icon: Zap,
    },
  ]

  const technologies = [
    { name: 'Machine Learning', role: 'Scikit-learn & XGBoost', icon: Cpu },
    { name: 'Network Analytics', role: 'Flow Inspection & Telemetry', icon: Activity },
    { name: 'FastAPI', role: 'High-Throughput Async REST API', icon: Server },
    { name: 'PostgreSQL', role: 'Relational Telemetry Storage', icon: Database },
    { name: 'React', role: 'Dynamic SOC Dashboard UI', icon: Code2 },
    { name: 'Python', role: 'Core ML & Pipeline Engine', icon: Terminal },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-cyber-950 text-slate-100 cyber-grid">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Phase Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-800/80 mb-8 shadow-sm">
            <Badge variant="info" size="sm" dot>
              Phase 1 Architecture Active
            </Badge>
            <span className="text-xs text-slate-300 font-medium">
              SIH26153 • AI Network Attack Forecasting
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
            AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">Network Security</span> Intelligence
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Detect suspicious network behavior, analyze cyber threats, and gain
            actionable security insights with AI-powered network analytics.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/design">
              <Button size="lg" icon={ArrowRight} iconPosition="right" className="shadow-cyber">
                Explore Dashboard
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="secondary" size="lg">
                Learn How It Works
              </Button>
            </a>
          </div>

          {/* Telemetry Preview Graphic */}
          <div className="mt-16 max-w-4xl mx-auto rounded-2xl border border-cyber-800/90 bg-cyber-900/90 p-4 shadow-cyber backdrop-blur-md">
            <div className="flex items-center justify-between px-3 py-2 border-b border-cyber-800/80 mb-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-slate-300">netguard_sentinel::flow_stream.log</span>
              </div>
              <Badge variant="low" size="sm" dot>SECURE STREAM</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left font-mono">
              <div className="p-3 bg-cyber-950/80 rounded-lg border border-cyber-800/60">
                <span className="text-[10px] text-slate-500 uppercase">Packet Rate</span>
                <p className="text-sm text-cyan-400 font-semibold mt-1">42,850 pkts/s</p>
              </div>
              <div className="p-3 bg-cyber-950/80 rounded-lg border border-cyber-800/60">
                <span className="text-[10px] text-slate-500 uppercase">Detection Engine</span>
                <p className="text-sm text-slate-200 font-semibold mt-1">Dual Stage ML</p>
              </div>
              <div className="p-3 bg-cyber-950/80 rounded-lg border border-cyber-800/60">
                <span className="text-[10px] text-slate-500 uppercase">Threat Vector</span>
                <p className="text-sm text-amber-400 font-semibold mt-1">Port Scan [TCP]</p>
              </div>
              <div className="p-3 bg-cyber-950/80 rounded-lg border border-cyber-800/60">
                <span className="text-[10px] text-slate-500 uppercase">Inference Time</span>
                <p className="text-sm text-emerald-400 font-semibold mt-1">1.82 ms/flow</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities / Features */}
      <section className="py-20 bg-cyber-900/40 border-y border-cyber-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              Core Security Architecture
            </span>
            <h2 className="text-3xl font-bold text-slate-100 mt-2">
              Comprehensive Threat Detection & Mitigation
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Designed from first principles to bridge low-level network flow telemetry
              with robust machine learning and real-time security operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feat) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.title}
                  className={`bg-cyber-900/90 border border-cyber-800 rounded-xl p-6 transition-all duration-200 hover:border-slate-700 hover:shadow-cyber border-l-4 ${feat.accent}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-cyber-850 border border-cyber-800 text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="default" size="sm">
                      {feat.badge}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              Detection Pipeline
            </span>
            <h2 className="text-3xl font-bold text-slate-100 mt-2">
              How NetGuard AI Works
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              A transparent, four-stage pipeline transforming high-speed packet streams into
              actionable cybersecurity defense directives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.step}
                  className="relative bg-cyber-900 border border-cyber-800 rounded-xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-2xl font-bold text-cyan-500/60">
                        {step.step}
                      </span>
                      <div className="p-2 rounded-lg bg-cyber-850 text-cyan-400">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-100 mb-2">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust & Technology Section */}
      <section className="py-20 bg-cyber-900/50 border-t border-cyber-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              Enterprise Tech Stack
            </span>
            <h2 className="text-2xl font-bold text-slate-100 mt-2">
              Built on Modern Computer Science Foundations
            </h2>
            <p className="text-slate-400 text-xs mt-2">
              Robust, battle-tested technologies engineered for scale, auditability, and sub-millisecond classification.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {technologies.map((tech) => {
              const Icon = tech.icon
              return (
                <div
                  key={tech.name}
                  className="flex flex-col items-center justify-center p-4 bg-cyber-900/90 border border-cyber-800 rounded-xl text-center hover:border-slate-700 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-cyber-850 text-cyan-400 mb-2">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{tech.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{tech.role}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-cyber-800 bg-cyber-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">NetGuard AI</span>
            <span>— Network Attack Detection & Forecasting Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/design" className="hover:text-slate-300 transition-colors">
              UI Design System
            </Link>
            <a
              href={API_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              API Reference
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
