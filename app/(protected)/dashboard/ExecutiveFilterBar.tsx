'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MODULE_OPTIONS = [
  { value: 'all', label: 'All modules' },
  { value: 'strategic', label: 'Strategic' },
  { value: 'risk', label: 'Risk' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'board', label: 'Board' },
  { value: 'incidents', label: 'Incidents' },
  { value: 'audit', label: 'Audit' },
] as const

interface ExecutiveFilterBarProps {
  initialFrom: string
  initialTo: string
  initialDepartment: string
  initialModule: string
}

export function ExecutiveFilterBar({
  initialFrom,
  initialTo,
  initialDepartment,
  initialModule,
}: ExecutiveFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [department, setDepartment] = useState(initialDepartment)
  const [moduleFilter, setModuleFilter] = useState(initialModule || 'all')

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString())

    params.set('from', from)
    params.set('to', to)

    if (department.trim()) {
      params.set('department', department.trim())
    } else {
      params.delete('department')
    }

    if (moduleFilter && moduleFilter !== 'all') {
      params.set('module', moduleFilter)
    } else {
      params.delete('module')
    }

    params.delete('page')
    router.push(`/dashboard?${params.toString()}`)
  }

  function clearFilters() {
    const params = new URLSearchParams()
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 items-end rounded-[10px] border border-paper-border bg-white p-4 shadow-card">
      <div>
        <label className="mb-1 block text-[12px] font-medium text-navy-mid">From</label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[160px]" />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-medium text-navy-mid">To</label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[160px]" />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-medium text-navy-mid">Department</label>
        <Input
          placeholder="dept UUID"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-9 w-[220px]"
        />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-medium text-navy-mid">Module</label>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="All modules" />
          </SelectTrigger>
          <SelectContent>
            {MODULE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 flex gap-2">
        <Button size="sm" className="h-9 bg-gold text-navy-950 hover:bg-gold-hi" onClick={applyFilters}>
          Apply
        </Button>
        <Button size="sm" variant="outline" className="h-9" onClick={clearFilters}>
          Clear
        </Button>
      </div>
    </div>
  )
}
