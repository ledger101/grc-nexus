import { cn } from '@/lib/utils'
import type { IncidentCategory } from '@/types/incidents'

const CATEGORY_BADGE: Record<IncidentCategory, string> = {
  fraud: 'bg-err/10 text-err border-err/30',
  misconduct: 'bg-warn/10 text-warn border-warn/30',
  safety: 'bg-blue-50 text-blue-700 border-blue-200',
  cyber: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  governance: 'bg-teal-50 text-teal-700 border-teal-200',
  other: 'bg-paper text-navy-mid border-paper-border',
}

const CATEGORY_LABEL: Record<IncidentCategory, string> = {
  fraud: 'Fraud',
  misconduct: 'Misconduct',
  safety: 'Safety',
  cyber: 'Cyber',
  governance: 'Governance',
  other: 'Other',
}

export function IncidentCategoryBadge({ category, className }: { category: IncidentCategory; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-[6px] border px-[8px] py-[4px] text-[13px] font-medium',
        CATEGORY_BADGE[category],
        className,
      )}
    >
      {CATEGORY_LABEL[category]}
    </span>
  )
}
