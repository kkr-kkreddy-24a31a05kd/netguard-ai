import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-950 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg'

  const variants = {
    primary: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-cyber-sm hover:shadow-cyber-glow focus:ring-cyan-400',
    secondary: 'bg-cyber-850 hover:bg-cyber-800 text-slate-200 border border-cyber-800 hover:border-slate-600 focus:ring-slate-500',
    outline: 'border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 hover:bg-cyan-950/40 focus:ring-cyan-400',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-threat-critical focus:ring-rose-500',
    ghost: 'text-slate-400 hover:text-slate-100 hover:bg-cyber-850/60 focus:ring-slate-600',
  }

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }

  return (
    <button
      disabled={disabled || loading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </button>
  )
}
