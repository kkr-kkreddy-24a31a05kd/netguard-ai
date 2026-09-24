import React from 'react'
import { cn } from '../../utils/cn'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'

export default function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No network flow records found',
  onRowClick,
  className,
}) {
  return (
    <div className={cn('w-full overflow-hidden rounded-xl border border-cyber-800 bg-cyber-900', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-cyber-800 bg-cyber-950/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={cn('px-4 py-3', col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left', col.headerClassName)}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-800/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <LoadingState text="Scanning telemetry buffers..." variant="radar" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState title="No Records" description={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors duration-150',
                    onRowClick ? 'cursor-pointer hover:bg-cyan-950/20' : 'hover:bg-cyber-850/40'
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={cn(
                        'px-4 py-3 text-slate-300 font-sans',
                        col.mono && 'font-mono text-slate-200',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
