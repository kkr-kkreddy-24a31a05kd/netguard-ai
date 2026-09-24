import React from 'react'
import { Loader2, ShieldAlert } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function LoadingState({
  text = 'Analyzing network flows...',
  variant = 'spinner', // 'spinner' | 'radar' | 'skeleton'
  rows = 3,
  className,
}) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('w-full space-y-3 animate-pulse p-4', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-8 bg-cyber-850 rounded-lg w-full" />
        ))}
      </div>
    )
  }

  if (variant === 'radar') {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 space-y-4 text-center', className)}>
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full border border-cyan-500/30 bg-cyan-950/20">
          <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping opacity-25" />
          <div className="w-8 h-8 rounded-full border border-cyan-400/60 animate-pulse" />
          <ShieldAlert className="w-5 h-5 text-cyan-400 relative z-10" />
        </div>
        {text && <p className="text-xs font-mono text-cyan-300 tracking-wide animate-pulse">{text}</p>}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 space-y-3 text-center', className)}>
      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      {text && <p className="text-xs text-slate-400 font-medium">{text}</p>}
    </div>
  )
}
