'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateRiskTreatmentStatus } from '@/lib/risk/actions'
import type { TreatmentStatus } from '@/types/risk'
import { cn } from '@/lib/utils'
import { TREATMENT_STATUS_BADGE } from '@/lib/risk/risk-utils'

type EditableTreatmentStatus = Exclude<TreatmentStatus, 'overdue'>
const EDITABLE_STATUSES: EditableTreatmentStatus[] = ['planned', 'in_progress', 'completed', 'cancelled']

interface TreatmentStatusSelectProps {
  treatmentId: string
  currentStatus: TreatmentStatus
  isOverdue: boolean
}

export function TreatmentStatusSelect({
  treatmentId,
  currentStatus,
  isOverdue,
}: TreatmentStatusSelectProps) {
  const router = useRouter()
  const [status, setStatus] = useState<EditableTreatmentStatus>(
    currentStatus === 'overdue' ? 'planned' : currentStatus,
  )
  const [isPending, startTransition] = useTransition()

  if (isOverdue || currentStatus === 'overdue') {
    return (
      <span className={cn('rounded-[6px] border px-2 py-1 text-[12px] font-semibold', TREATMENT_STATUS_BADGE.overdue)}>
        Overdue
      </span>
    )
  }

  return (
    <Select
      value={status}
      onValueChange={(next) => {
        const nextStatus = next as EditableTreatmentStatus
        const previous = status
        setStatus(nextStatus)

        startTransition(async () => {
          const result = await updateRiskTreatmentStatus(treatmentId, { status: nextStatus })
          if ('error' in result) {
            setStatus(previous)
            toast.error(result.error)
            return
          }

          toast.success('Treatment status updated.')
          router.refresh()
        })
      }}
      disabled={isPending}
    >
      <SelectTrigger className="h-8 w-[150px] border-paper-border text-[12px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {EDITABLE_STATUSES.map((item) => (
          <SelectItem key={item} value={item}>
            {item === 'in_progress' ? 'In Progress' : item.charAt(0).toUpperCase() + item.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
