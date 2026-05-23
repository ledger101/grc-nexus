'use client'
// app/(protected)/admin/audit-log/FilterBar.tsx
// Audit log filter bar per UI-SPEC Screen 8.
// Pushes filter state to URL query params using useRouter().
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const GOVERNANCE_TABLES = [
  'institutions',
  'user_profiles',
  'user_roles',
  'mfa_device_trust',
  'mfa_backup_codes',
  'mfa_otp_challenges',
  'audit_events',
  'auth_events',
]

const GOVERNANCE_MODULES = ['strategic', 'risk', 'compliance', 'board', 'incidents', 'audit']

export function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [actorSearch, setActorSearch] = useState(searchParams.get('actor') ?? '')
  const [action, setAction] = useState(searchParams.get('action') ?? 'all')
  const [tableName, setTableName] = useState(searchParams.get('table') ?? 'all')
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') ?? '')
  const [dateTo, setDateTo] = useState(searchParams.get('to') ?? '')
  const [moduleName, setModuleName] = useState(searchParams.get('module') ?? 'all')
  const [department, setDepartment] = useState(searchParams.get('department') ?? '')

  function handleApply() {
    const params = new URLSearchParams()
    if (actorSearch) params.set('actor', actorSearch)
    if (action && action !== 'all') params.set('action', action)
    if (tableName && tableName !== 'all') params.set('table', tableName)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    if (moduleName && moduleName !== 'all') params.set('module', moduleName)
    if (department.trim()) params.set('department', department.trim())
    params.set('page', '1')
    router.push(`/admin/audit-log?${params.toString()}`)
  }

  function handleClear() {
    setActorSearch('')
    setAction('all')
    setTableName('all')
    setDateFrom('')
    setDateTo('')
    setModuleName('all')
    setDepartment('')
    router.push('/admin/audit-log')
  }

  return (
    <div className="flex flex-wrap gap-3 mb-4 items-end">
      {/* Actor search */}
      <div>
        <label className="text-[12px] font-medium text-navy-mid block mb-1">Actor</label>
        <Input
          placeholder="Name or ID..."
          value={actorSearch}
          onChange={(e) => setActorSearch(e.target.value)}
          className="w-[200px] h-9 border-paper-border text-[13px]"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
      </div>

      {/* Action type */}
      <div>
        <label className="text-[12px] font-medium text-navy-mid block mb-1">Action</label>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[140px] h-9 border-paper-border text-[13px]">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="AUTH">AUTH</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table name */}
      <div>
        <label className="text-[12px] font-medium text-navy-mid block mb-1">Table</label>
        <Select value={tableName} onValueChange={setTableName}>
          <SelectTrigger className="w-[180px] h-9 border-paper-border text-[13px]">
            <SelectValue placeholder="All tables" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tables</SelectItem>
            {GOVERNANCE_TABLES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date from */}
      <div>
        <label className="text-[12px] font-medium text-navy-mid block mb-1">From</label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[150px] h-9 border-paper-border text-[13px]"
        />
      </div>

      {/* Date to */}
      <div>
        <label className="text-[12px] font-medium text-navy-mid block mb-1">To</label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-[150px] h-9 border-paper-border text-[13px]"
        />
      </div>

      {/* Module */}
      <div>
        <label className="text-[12px] font-medium text-navy-mid block mb-1">Module</label>
        <Select value={moduleName} onValueChange={setModuleName}>
          <SelectTrigger className="w-[170px] h-9 border-paper-border text-[13px]">
            <SelectValue placeholder="All modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {GOVERNANCE_MODULES.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Department */}
      <div>
        <label className="text-[12px] font-medium text-navy-mid block mb-1">Department</label>
        <Input
          placeholder="dept UUID"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-[190px] h-9 border-paper-border text-[13px]"
        />
      </div>

      {/* Apply / Clear */}
      <div className="flex gap-2 mt-5">
        <Button
          size="sm"
          className="h-9 bg-gold text-navy-950 hover:bg-gold-hi text-[13px] px-4"
          onClick={handleApply}
        >
          Apply filters
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 border-paper-border text-[13px]"
          onClick={handleClear}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
