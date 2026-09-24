import React from 'react'
import { cn } from '../../utils/cn'

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border transition-colors select-none'

  const variants = {
    // Standard threat severity levels
    low: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
    medium: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
    high: 'bg-orange-950/60 text-orange-300 border-orange-800/80',
    critical: 'bg-rose-950/70 text-rose-300 border-rose-800/90 shadow-sm shadow-rose-900/50',
    // Functional badges
    info: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80',
    normal: 'bg-slate-900 text-slate-300 border-slate-700',
    indigo: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80',
    default: 'bg-cyber-850 text-slate-300 border-cyber-800',
  }

  const dotColors = {
    low: 'bg-emerald-400',
    medium: 'bg-amber-400',
    high: 'bg-orange-400',
    critical: 'bg-rose-400 animate-ping',
    info: 'bg-cyan-400',
    normal: 'bg-slate-400',
    indigo: 'bg-indigo-400',
    default: 'bg-slate-400',
  }

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  }

  const normalizedVariant = variant?.toLowerCase() || 'default'
  const activeVariant = variants[normalizedVariant] ? normalizedVariant : 'default'

  return (
    <span className={cn(baseStyles, variants[activeVariant], sizes[size], className)} {...props}>
      {dot && (
        <span className="relative flex h-2 w-2">
          <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', dotColors[activeVariant])} />
          <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColors[activeVariant].replace(' animate-ping', ''))} />
        </span>
      )}
      <span>{children}</span>
    </span>
  )
}
