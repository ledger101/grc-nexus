import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TreatmentStatusSelect } from '@/components/risk/TreatmentStatusSelect'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('@/lib/risk/actions', () => ({
  updateRiskTreatmentStatus: vi.fn(async () => ({ data: { id: 't-1' } })),
}))

describe('TreatmentStatusSelect', () => {
  it('renders read-only overdue badge for overdue rows', () => {
    render(React.createElement(TreatmentStatusSelect, {
      treatmentId: 't-1',
      currentStatus: 'planned',
      isOverdue: true,
    }))

    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })
}
)
