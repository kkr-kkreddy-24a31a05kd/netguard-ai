import React from 'react'
import { cn } from '../../utils/cn'

export default function Card({
  title,
  subtitle,
  action,
  children,
  footer,
  className,
  headerClassName,
  glow = false,
  bordered = true,
  ...props
}) {
  return (
    <div
      className={cn(
        'relative bg-cyber-900/90 rounded-xl overflow-hidden transition-all duration-200',
        bordered && 'border border-cyber-800 hover:border-slate-700/80',
        glow && 'shadow-cyber hover:shadow-cyber-glow',
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div
          className={cn(
            'flex items-center justify-between px-5 py-4 border-b border-cyber-800/80 bg-cyber-950/30',
            headerClassName
          )}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      <div className="p-5">{children}</div>

      {footer && (
        <div className="px-5 py-3 border-t border-cyber-800/80 bg-cyber-950/40 text-xs text-slate-400">
          {footer}
        </div>
      )}
    </div>
  )
}
