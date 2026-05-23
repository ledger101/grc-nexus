'use client'
// app/(protected)/strategic/KpiGrid.tsx
// TanStack Table v8 KPI summary grid. (D-18, D-21, STRAT-06)
// All 7 columns: KPI Title, Objective, Owner, Last Reading, Status, Trend, Frequency.
// Pagination footer with server-side prev/next links.
import { useMemo, useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { KpiSparkline } from './KpiSparkline'
import { calculateKpiStatus, KPI_STATUS_BADGE } from '@/lib/strategic/kpi-utils'
import { getLatestReading } from '@/lib/strategic/queries'

// KpiRow mirrors the shape returned by getKpisWithReadings in lib/strategic/queries.ts
type KpiRow = {
  id: string
  title: string
  owner_id: string | null
  target_value: number
  unit_of_measure: string
  reporting_frequency: string
  objective_id: string
  strategic_objectives: { id: string; title: string } | null
  kpi_readings: { actual_value: number; reporting_period: string; recorded_at: string }[]
  user_profiles: { full_name: string } | null
}

interface KpiGridProps {
  kpis: KpiRow[]
  totalCount: number
  page: number
  pageSize: number
  statusFilter?: string
}

// Human-readable frequency labels
const FREQUENCY_LABEL: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
}

export function KpiGrid({ kpis, totalCount, page, pageSize, statusFilter }: KpiGridProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  // Pre-filter by computed status (status is not a DB column — computed from readings)
  const filteredKpis = useMemo(() => {
    if (!statusFilter) return kpis
    return kpis.filter((kpi) => {
      const latest = getLatestReading(kpi.kpi_readings ?? [])
      const status = calculateKpiStatus(latest?.actual_value ?? null, kpi.target_value)
      return status === statusFilter
    })
  }, [kpis, statusFilter])

  // columns MUST be wrapped in useMemo to prevent redefinition on every render (v8 requirement)
  const columns = useMemo<ColumnDef<KpiRow>[]>(
    () => [
      // Column 1: KPI Title — links to detail page
      {
        accessorKey: 'title',
        header: 'KPI Title',
        cell: ({ row }) => (
          <a
            href={`/strategic/kpis/${row.original.id}`}
            className="text-navy-900 font-medium hover:text-gold hover:underline transition-colors"
          >
            {row.original.title}
          </a>
        ),
      },
      // Column 2: Linked Objective
      {
        id: 'objective',
        header: 'Objective',
        cell: ({ row }) => (
          <span className="text-navy-mid text-[13px]">
            {row.original.strategic_objectives?.title ?? '—'}
          </span>
        ),
      },
      // Column 3: Owner
      {
        id: 'owner',
        header: 'Owner',
        cell: ({ row }) => (
          <span className="text-navy-mid text-[13px]">
            {row.original.user_profiles?.full_name ?? '—'}
          </span>
        ),
      },
      // Column 4: Last Reading (value + period)
      {
        id: 'last_reading',
        header: 'Last Reading',
        cell: ({ row }) => {
          const latest = getLatestReading(row.original.kpi_readings ?? [])
          if (!latest) {
            return <span className="text-navy-mid text-[13px]">—</span>
          }
          return (
            <div className="text-[13px]">
              <span className="font-medium text-navy-900">
                {latest.actual_value} {row.original.unit_of_measure}
              </span>
              <span className="text-navy-mid ml-1 text-[12px]">({latest.reporting_period})</span>
            </div>
          )
        },
      },
      // Column 5: Performance Status badge
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const latest = getLatestReading(row.original.kpi_readings ?? [])
          const status = calculateKpiStatus(
            latest?.actual_value ?? null,
            row.original.target_value
          )
          const badge = KPI_STATUS_BADGE[status]
          return (
            <Badge
              className={`text-[11px] font-semibold border w-fit ${badge.className}`}
            >
              {badge.label}
            </Badge>
          )
        },
      },
      // Column 6: Trend Sparkline
      {
        id: 'trend',
        header: 'Trend',
        cell: ({ row }) => {
          const latest = getLatestReading(row.original.kpi_readings ?? [])
          const status = calculateKpiStatus(
            latest?.actual_value ?? null,
            row.original.target_value
          )
          return (
            <KpiSparkline
              readings={row.original.kpi_readings ?? []}
              status={status}
            />
          )
        },
      },
      // Column 7: Reporting Frequency
      {
        accessorKey: 'reporting_frequency',
        header: 'Frequency',
        cell: ({ row }) => (
          <span className="text-navy-mid text-[13px]">
            {FREQUENCY_LABEL[row.original.reporting_frequency] ?? row.original.reporting_frequency}
          </span>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: filteredKpis,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="bg-white rounded-[10px] border border-paper-border shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-paper">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-[12px] font-semibold uppercase tracking-wider text-navy-mid cursor-pointer select-none px-4 py-3"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc'
                    ? ' ↑'
                    : header.column.getIsSorted() === 'desc'
                    ? ' ↓'
                    : null}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-20 text-navy-mid text-[14px]"
              >
                No KPIs found. Create KPIs from a strategic objective.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-paper/50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-[13px] text-navy-900 px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination footer */}
      <div className="px-4 py-3 border-t border-paper-border bg-paper flex items-center justify-between">
        <span className="text-[13px] text-navy-mid">
          {totalCount === 0
            ? 'No KPIs'
            : `Showing ${Math.min((page - 1) * pageSize + 1, totalCount)}–${Math.min(
                page * pageSize,
                totalCount
              )} of ${totalCount} KPIs`}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <a
              href={`/strategic?page=${page - 1}`}
              className="text-[13px] text-navy-mid hover:text-navy-900 px-3 py-1 rounded border border-paper-border"
            >
              Previous
            </a>
          )}
          {page * pageSize < totalCount && (
            <a
              href={`/strategic?page=${page + 1}`}
              className="text-[13px] text-navy-mid hover:text-navy-900 px-3 py-1 rounded border border-paper-border"
            >
              Next
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
