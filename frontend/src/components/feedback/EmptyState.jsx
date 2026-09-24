import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function EmptyState({
  title = 'No Data Available',
  description = 'No network anomalies or threat detections currently recorded in this view.',
  icon: Icon = ShieldCheck,
  action,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="p-3.5 rounded-full bg-cyber-850/80 border border-cyber-800 text-slate-400 mb-3">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
