import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Alert({
  variant = 'info',
  title,
  message,
  children,
  onClose,
  className,
}) {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
    critical: AlertCircle,
  }

  const styles = {
    info: 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200',
    success: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200',
    warning: 'bg-amber-950/40 border-amber-800/80 text-amber-200',
    error: 'bg-rose-950/40 border-rose-800/80 text-rose-200',
    critical: 'bg-rose-950/70 border-rose-600/90 text-rose-100 shadow-sm shadow-rose-900/50',
  }

  const iconColors = {
    info: 'text-cyan-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400',
    critical: 'text-rose-300 animate-pulse',
  }

  const IconComponent = icons[variant] || Info

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4 text-sm transition-all',
        styles[variant],
        className
      )}
    >
      <IconComponent className={cn('h-5 w-5 shrink-0 mt-0.5', iconColors[variant])} />
      <div className="flex-1">
        {title && <h5 className="font-semibold text-slate-100 mb-0.5">{title}</h5>}
        {message && <div className="text-xs opacity-90 leading-relaxed">{message}</div>}
        {children && <div className="mt-1 text-xs opacity-90">{children}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
