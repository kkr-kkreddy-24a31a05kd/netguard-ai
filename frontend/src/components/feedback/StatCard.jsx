import React from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  threatLevel, // 'low' | 'medium' | 'high' | 'critical'
  subtitle,
  className,
}) {
  const threatAccents = {
    low: 'border-l-4 border-l-emerald-500',
    medium: 'border-l-4 border-l-amber-500',
    high: 'border-l-4 border-l-orange-500',
    critical: 'border-l-4 border-l-rose-500 shadow-sm shadow-rose-950/40',
  }

  const changeColors = {
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
    neutral: 'text-slate-400',
  }

  const ChangeIcon =
    changeType === 'positive'
      ? ArrowUpRight
      : changeType === 'negative'
      ? ArrowDownRight
      : Minus

  return (
    <div
      className={cn(
        'relative bg-cyber-900 border border-cyber-800 rounded-xl p-5 overflow-hidden transition-all duration-200 hover:border-slate-700',
        threatLevel && threatAccents[threatLevel],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-cyber-850 border border-cyber-800 text-cyan-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
          {value}
        </span>
        {change && (
          <span
            className={cn(
              'inline-flex items-center text-xs font-medium font-mono',
              changeColors[changeType]
            )}
          >
            <ChangeIcon className="w-3.5 h-3.5 mr-0.5" />
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  )
}
