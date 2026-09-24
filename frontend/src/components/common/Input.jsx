import React from 'react'
import { cn } from '../../utils/cn'

export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className,
  id,
  required,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'block w-full rounded-lg bg-cyber-950/80 border text-slate-100 placeholder-slate-500 text-sm transition-colors duration-150',
            'focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500',
            Icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2',
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500 text-rose-100'
              : 'border-cyber-800 hover:border-slate-700',
            props.disabled && 'opacity-50 cursor-not-allowed bg-cyber-900',
            className
          )}
          {...props}
        />
      </div>

      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
    </div>
  )
}
