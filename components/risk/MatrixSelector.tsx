'use client'

import { useMemo } from 'react'
import { calculateRiskScore, getRiskSeverity, RISK_HEATMAP_CELL_BG } from '@/lib/risk/risk-utils'
import { RISK_SEVERITY_BADGE } from '@/lib/risk/risk-utils'
import { cn } from '@/lib/utils'

interface MatrixSelectorProps {
  likelihood: number | null
  impact: number | null
  onChange: (value: { likelihood: number; impact: number }) => void
  idPrefix: string
}

export function MatrixSelector({ likelihood, impact, onChange, idPrefix }: MatrixSelectorProps) {
  const selectedScore = useMemo(() => {
    if (!likelihood || !impact) return null
    return calculateRiskScore(likelihood, impact)
  }, [likelihood, impact])

  function setCell(nextLikelihood: number, nextImpact: number) {
    onChange({ likelihood: nextLikelihood, impact: nextImpact })
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentLikelihood: number,
    currentImpact: number,
  ) {
    let nextLikelihood = currentLikelihood
    let nextImpact = currentImpact

    if (event.key === 'ArrowUp') nextLikelihood = Math.min(5, currentLikelihood + 1)
    if (event.key === 'ArrowDown') nextLikelihood = Math.max(1, currentLikelihood - 1)
    if (event.key === 'ArrowLeft') nextImpact = Math.max(1, currentImpact - 1)
    if (event.key === 'ArrowRight') nextImpact = Math.min(5, currentImpact + 1)

    if (nextLikelihood !== currentLikelihood || nextImpact !== currentImpact) {
      event.preventDefault()
      setCell(nextLikelihood, nextImpact)
      const nextCellId = `${idPrefix}-l${nextLikelihood}-i${nextImpact}`
      const nextEl = document.getElementById(nextCellId)
      if (nextEl) nextEl.focus()
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      setCell(currentLikelihood, currentImpact)
    }
  }

  return (
    <div className="inline-block rounded-[8px] border border-paper-border bg-white p-4">
      <div className="flex gap-2">
        <div className="flex flex-col items-end justify-between py-1 text-[11px] text-navy-mid">
          {[5, 4, 3, 2, 1].map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-1">
          {[5, 4, 3, 2, 1].map((l) =>
            [1, 2, 3, 4, 5].map((i) => {
              const score = calculateRiskScore(l, i)
              const severity = getRiskSeverity(score)
              const selected = likelihood === l && impact === i

              return (
                <button
                  key={`${l}-${i}`}
                  id={`${idPrefix}-l${l}-i${i}`}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Likelihood ${l}, Impact ${i}, Score ${score}, ${severity}`}
                  className={cn(
                    'h-12 w-12 rounded-[4px] border text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60',
                    RISK_HEATMAP_CELL_BG[severity],
                    selected ? 'border-gold ring-2 ring-gold/30' : 'border-paper-border/60 hover:border-paper-border',
                  )}
                  onClick={() => setCell(l, i)}
                  onKeyDown={(event) => handleKeyDown(event, l, i)}
                >
                  {score}
                </button>
              )
            }),
          )}
        </div>
      </div>

      <div className="mt-2 ml-6 grid grid-cols-5 gap-1 text-center text-[11px] text-navy-mid">
        {[1, 2, 3, 4, 5].map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>

      <div className="mt-3 flex min-h-6 items-center gap-2 text-[13px]">
        {selectedScore ? (
          <>
            <span className="font-mono text-navy-900">
              L{likelihood} x I{impact} = {selectedScore}
            </span>
            <span
              className={cn(
                'rounded-[6px] border px-2 py-0.5 text-[12px] font-medium capitalize',
                RISK_SEVERITY_BADGE[getRiskSeverity(selectedScore)],
              )}
            >
              {getRiskSeverity(selectedScore)}
            </span>
          </>
        ) : (
          <span className="text-navy-mid">Select a cell to score.</span>
        )}
      </div>
    </div>
  )
}
