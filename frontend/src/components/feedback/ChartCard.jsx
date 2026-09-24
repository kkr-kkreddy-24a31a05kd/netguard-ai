import React from 'react'
import { BarChart3, Maximize2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function ChartCard({
  title,
  subtitle,
  badge,
  action,
  children,
  footerInfo,
  className,
  height = 'h-64',
}) {
  return (
    <div
      className={cn(
        'relative bg-cyber-900 border border-cyber-800 rounded-xl p-5 overflow-hidden transition-all duration-200 hover:border-slate-700/80 flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyber-800/80 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className={cn('relative w-full flex items-center justify-center', height)}>
        {children}
      </div>

      {/* Footer info note */}
      {footerInfo && (
        <div className="mt-3 pt-2 border-t border-cyber-800/60 text-[11px] text-slate-500 font-mono flex items-center justify-between">
          <span>{footerInfo}</span>
        </div>
      )}
    </div>
  )
}
