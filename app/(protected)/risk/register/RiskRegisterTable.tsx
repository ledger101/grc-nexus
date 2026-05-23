'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { RiskFilterBar } from './RiskFilterBar'
import { calculateRiskScore, getRiskSeverity, RISK_SEVERITY_BADGE } from '@/lib/risk/risk-utils'
import { cn } from '@/lib/utils'
import type { RiskCategory, RiskStatus } from '@/types/risk'

type RegisterRow = {
  id: string
  title: string
  category: RiskCategory
  ownerId: string
  ownerName: string
  status: RiskStatus
  inherentLikelihood: number
  inherentImpact: number
  residualLikelihood: number | null
  residualImpact: number | null
  treatmentsCount: number
}

const column = createColumnHelper<RegisterRow>()

export function RiskRegisterTable({ rows }: { rows: RegisterRow[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const category = (columnFilters.find((f) => f.id === 'category')?.value as string) ?? 'all'
  const severity = (columnFilters.find((f) => f.id === 'severity')?.value as string) ?? 'all'
  const owner = (columnFilters.find((f) => f.id === 'ownerId')?.value as string) ?? 'all'
  const status = (columnFilters.find((f) => f.id === 'status')?.value as string) ?? 'all'

  const owners = useMemo(() => {
    const map = new Map<string, string>()
    rows.forEach((row) => map.set(row.ownerId, row.ownerName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [rows])

  const columns = useMemo(
    () => [
      column.accessor('title', {
        header: 'Risk',
        cell: (info) => (
          <Link href={`/risk/${info.row.original.id}`} className="font-medium text-navy-900 hover:underline">
            {info.getValue()}
          </Link>
        ),
      }),
      column.accessor('category', {
        header: 'Category',
        cell: (info) => <span className="capitalize text-[13px] text-navy-900">{info.getValue()}</span>,
        filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
      }),
      column.display({
        id: 'inherentScore',
        header: 'Inherent',
        cell: (info) => {
          const row = info.row.original
          const score = calculateRiskScore(row.inherentLikelihood, row.inherentImpact)
          return <span className="font-mono text-[13px] text-navy-900">{row.inherentLikelihood}x{row.inherentImpact}={score}</span>
        },
      }),
      column.display({
        id: 'severity',
        header: 'Severity',
        cell: (info) => {
          const row = info.row.original
          const severityValue = getRiskSeverity(calculateRiskScore(row.inherentLikelihood, row.inherentImpact))
          return (
            <span className={cn('inline-flex rounded-[6px] border px-2 py-1 text-[12px] font-medium capitalize', RISK_SEVERITY_BADGE[severityValue])}>
              {severityValue}
            </span>
          )
        },
        filterFn: (row, _id, value) => {
          if (value === 'all') return true
          const source = row.original
          const severityValue = getRiskSeverity(calculateRiskScore(source.inherentLikelihood, source.inherentImpact))
          return severityValue === value
        },
      }),
      column.display({
        id: 'residualScore',
        header: 'Residual',
        cell: (info) => {
          const row = info.row.original
          if (row.residualLikelihood === null || row.residualImpact === null) {
            return <span className="text-[13px] text-navy-mid">—</span>
          }
          const score = calculateRiskScore(row.residualLikelihood, row.residualImpact)
          return <span className="font-mono text-[13px] text-navy-900">{row.residualLikelihood}x{row.residualImpact}={score}</span>
        },
      }),
      column.accessor('ownerName', {
        header: 'Owner',
        cell: (info) => <span className="text-[13px] text-navy-900">{info.getValue()}</span>,
      }),
      column.accessor('ownerId', {
        header: 'Owner Filter',
        enableHiding: true,
        cell: () => null,
        filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
      }),
      column.accessor('status', {
        header: 'Status',
        cell: (info) => <span className="text-[13px] capitalize text-navy-900">{info.getValue()}</span>,
        filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
      }),
      column.accessor('treatmentsCount', {
        header: 'Treatments',
        cell: (info) => <span className="text-[13px] text-navy-900">{info.getValue()}</span>,
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      columnVisibility: {
        ownerId: false,
      },
    },
  })

  function setFilterState(next: { category?: string; severity?: string; owner?: string; status?: string }) {
    const updates: ColumnFiltersState = []

    const categoryValue = next.category ?? category
    const severityValue = next.severity ?? severity
    const ownerValue = next.owner ?? owner
    const statusValue = next.status ?? status

    updates.push({ id: 'category', value: categoryValue })
    updates.push({ id: 'severity', value: severityValue })
    updates.push({ id: 'ownerId', value: ownerValue })
    updates.push({ id: 'status', value: statusValue })

    setColumnFilters(updates)
  }

  return (
    <div>
      <RiskFilterBar
        category={category}
        severity={severity}
        owner={owner}
        status={status}
        owners={owners}
        onChange={setFilterState}
        onClear={() => setColumnFilters([
          { id: 'category', value: 'all' },
          { id: 'severity', value: 'all' },
          { id: 'ownerId', value: 'all' },
          { id: 'status', value: 'all' },
        ])}
      />

      <div className="overflow-x-auto rounded-[10px] border border-paper-border bg-white shadow-card">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="bg-paper">
                {group.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-[14px] text-navy-mid">No risks match the current filters.</td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-paper-border hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
