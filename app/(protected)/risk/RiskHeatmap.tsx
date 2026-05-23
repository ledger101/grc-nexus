'use client'

import Link from 'next/link'
import { calculateRiskScore, getRiskSeverity, RISK_HEATMAP_CELL_BG } from '@/lib/risk/risk-utils'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type HeatmapPoint = {
  id: string
  title: string
  inherent_likelihood: number
  inherent_impact: number
}

interface RiskHeatmapProps {
  points: HeatmapPoint[]
  cellSize?: number
}

export function RiskHeatmap({ points, cellSize = 64 }: RiskHeatmapProps) {
  const cells = Array.from({ length: 25 }, (_unused, index) => {
    const row = Math.floor(index / 5)
    const col = index % 5
    const likelihood = 5 - row
    const impact = col + 1
    const score = calculateRiskScore(likelihood, impact)
    const severity = getRiskSeverity(score)

    const cellPoints = points.filter(
      (point) => point.inherent_likelihood === likelihood && point.inherent_impact === impact,
    )

    return {
      key: `${likelihood}-${impact}`,
      likelihood,
      impact,
      severity,
      points: cellPoints,
    }
  })

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex gap-4">
        <div className="flex flex-col justify-between py-1 text-[11px] text-navy-mid">
          {[5, 4, 3, 2, 1].map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>

        <div>
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(5, ${cellSize}px)`,
              gridTemplateRows: `repeat(5, ${cellSize}px)`,
            }}
          >
            {cells.map((cell) => (
              <div
                key={cell.key}
                className={cn('relative flex flex-wrap items-center justify-center gap-1 rounded-[4px] border border-paper-border/60 p-1', RISK_HEATMAP_CELL_BG[cell.severity])}
              >
                {cell.points.slice(0, 4).map((point, pointIndex) => {
                  const pointScore = calculateRiskScore(point.inherent_likelihood, point.inherent_impact)
                  const pointSeverity = getRiskSeverity(pointScore)

                  return (
                    <Tooltip key={point.id}>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/risk/${point.id}`}
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white transition-transform hover:scale-110',
                            pointSeverity === 'low' && 'bg-ok',
                            pointSeverity === 'medium' && 'bg-warn',
                            pointSeverity === 'high' && 'bg-err',
                            pointSeverity === 'critical' && 'bg-err ring-2 ring-white ring-offset-1 ring-offset-err',
                          )}
                        >
                          {pointIndex + 1}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        <p className="text-[14px] font-medium">{point.title}</p>
                        <p className="mt-1 font-mono text-[12px] text-paper-border">
                          Score: {pointScore} ({pointSeverity})
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}

                {cell.points.length > 4 && (
                  <span className="text-[9px] text-navy-mid">+{cell.points.length - 4}</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-5 gap-[2px] text-center text-[11px] text-navy-mid">
            {[1, 2, 3, 4, 5].map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-navy-mid">Impact</p>
        </div>
      </div>
    </TooltipProvider>
  )
}
