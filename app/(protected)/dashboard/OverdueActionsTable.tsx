import type { OverdueActionItem } from '@/lib/reporting/types'

interface OverdueActionsTableProps {
  rows: OverdueActionItem[]
}

export function OverdueActionsTable({ rows }: OverdueActionsTableProps) {
  return (
    <div className="rounded-[10px] border border-paper-border bg-white p-5 shadow-card">
      <h2 className="text-[16px] font-semibold text-navy-900 font-body">Top Overdue Actions</h2>
      <p className="mt-1 text-[13px] text-navy-mid">Cross-module overdue tasks requiring leadership follow-up.</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-paper-border text-navy-mid">
              <th className="py-2 pr-3 font-medium">Title</th>
              <th className="py-2 pr-3 font-medium">Module</th>
              <th className="py-2 pr-3 font-medium">Due Date</th>
              <th className="py-2 pr-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-navy-mid">
                  No overdue actions for current filter scope.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.module}-${row.id}`} className="border-b border-paper-border/70 last:border-0">
                  <td className="py-3 pr-3 text-navy-900">{row.title}</td>
                  <td className="py-3 pr-3 uppercase tracking-wide text-navy-mid">{row.module}</td>
                  <td className="py-3 pr-3 text-navy-900">{row.dueDate}</td>
                  <td className="py-3 pr-3 text-navy-900">{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
