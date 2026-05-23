'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RiskFilterBarProps {
  category: string
  severity: string
  owner: string
  status: string
  owners: { id: string; name: string }[]
  onChange: (next: { category?: string; severity?: string; owner?: string; status?: string }) => void
  onClear: () => void
}

export function RiskFilterBar({
  category,
  severity,
  owner,
  status,
  owners,
  onChange,
  onClear,
}: RiskFilterBarProps) {
  const hasActiveFilters = category !== 'all' || severity !== 'all' || owner !== 'all' || status !== 'all'

  return (
    <div className="mb-4 flex flex-wrap gap-2 rounded-[8px] border border-paper-border bg-white p-3">
      <Select value={category} onValueChange={(value) => onChange({ category: value })}>
        <SelectTrigger className="h-10 w-[180px] border-paper-border text-[13px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          <SelectItem value="strategic">Strategic</SelectItem>
          <SelectItem value="operational">Operational</SelectItem>
          <SelectItem value="financial">Financial</SelectItem>
          <SelectItem value="compliance">Compliance</SelectItem>
          <SelectItem value="reputational">Reputational</SelectItem>
          <SelectItem value="technology">Technology</SelectItem>
        </SelectContent>
      </Select>

      <Select value={severity} onValueChange={(value) => onChange({ severity: value })}>
        <SelectTrigger className="h-10 w-[160px] border-paper-border text-[13px]">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All severities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>

      <Select value={owner} onValueChange={(value) => onChange({ owner: value })}>
        <SelectTrigger className="h-10 w-[200px] border-paper-border text-[13px]">
          <SelectValue placeholder="Owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All owners</SelectItem>
          {owners.map((entry) => (
            <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(value) => onChange({ status: value })}>
        <SelectTrigger className="h-10 w-[160px] border-paper-border text-[13px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="mitigated">Mitigated</SelectItem>
          <SelectItem value="accepted">Accepted</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
          <SelectItem value="escalated">Escalated</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          className="h-10 border-paper-border text-[13px]"
          onClick={onClear}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
