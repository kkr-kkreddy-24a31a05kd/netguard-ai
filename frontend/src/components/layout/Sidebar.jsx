import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Radio,
  Crosshair,
  AlertTriangle,
  BellRing,
  Cpu,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Sidebar({ className, activeItem = 'dashboard', onItemSelect }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const navItems = [
    { id: 'dashboard', label: 'SOC Overview', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'traffic', label: 'Flow Telemetry', icon: Radio, path: '/traffic' },
    { id: 'attacks', label: 'Live SOC Monitoring', icon: Radio, path: '/live', badge: 'Live' },
    { id: 'anomalies', label: 'Forecasting & Intel', icon: AlertTriangle, path: '/advanced', badge: 'Active' },
    { id: 'analytics', label: 'Threat Analytics', icon: ShieldAlert, path: '/analytics', badge: 'Active' },
    { id: 'alerts', label: 'Security Alerts', icon: BellRing, path: '/alerts', badge: 'Active' },
    { id: 'models', label: 'ML Engine Registry', icon: Cpu, path: '/models', badge: 'Active' },
    { id: 'settings', label: 'Admin & Governance', icon: Settings, path: '/admin', badge: 'Admin' },
  ]

  const handleClick = (item) => {
    if (onItemSelect) {
      onItemSelect(item.id)
    }
    if (item.path) {
      navigate(item.path)
    }
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-cyber-800 bg-cyber-900/90 transition-all duration-300 select-none z-20',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-14 px-3.5 border-b border-cyber-800/80">
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>SOC Telemetry</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-cyber-850 mx-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation items */}
      <div className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                isActive
                  ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-850/60'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-cyan-400' : 'text-slate-400')} />
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyber-800 text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer system info */}
      {!collapsed && (
        <div className="p-3 border-t border-cyber-800 text-[11px] text-slate-500 font-mono">
          <div>ENGINE: Dual-Stage ML</div>
          <div className="text-cyan-500/80">INGESTION: ACTIVE</div>
        </div>
      )}
    </aside>
  )
}
