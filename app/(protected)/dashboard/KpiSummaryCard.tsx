interface KpiSummaryCardProps {
  title: string
  value: number
  subtitle: string
}

export function KpiSummaryCard({ title, value, subtitle }: KpiSummaryCardProps) {
  return (
    <div className="rounded-[10px] border border-paper-border bg-white p-5 shadow-card">
      <p className="text-[12px] font-medium uppercase tracking-wide text-navy-mid">{title}</p>
      <p className="mt-2 text-[28px] font-bold text-navy-900 font-heading">{value.toLocaleString()}</p>
      <p className="mt-1 text-[13px] text-navy-mid">{subtitle}</p>
    </div>
  )
}
