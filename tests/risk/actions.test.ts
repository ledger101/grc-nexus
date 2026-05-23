import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

let mockUser: { id: string; app_metadata: Record<string, string> } | null = null

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({ data: { user: mockUser }, error: null })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'risk-1' }, error: null })) })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'risk-1' }, error: null })) })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'risk-1', risk_id: 'risk-1', owner_id: null, title: 'T', due_date: '2099-01-01', status: 'planned', institution_id: 'inst-1' }, error: null })) })),
      })),
    })),
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: vi.fn(async () => ({ data: { id: 'email-1' } })) }
  },
}))

vi.mock('@supabase/supabase-js', async () => {
  const actual = await vi.importActual<typeof import('@supabase/supabase-js')>('@supabase/supabase-js')
  return {
    ...actual,
    createClient: vi.fn(() => ({
      auth: { admin: { getUserById: vi.fn(async () => ({ data: { user: { email: 'owner@example.com' } }, error: null })) } },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ data: [{ user_id: 'u-1' }], error: null })),
            single: vi.fn(() => ({ data: { first_name: 'Owner', last_name: 'Name' }, error: null })),
          })),
        })),
      })),
    })),
  }
})

import { createRisk, updateRiskTreatmentStatus } from '@/lib/risk/actions'

const baseRiskInput = {
  objective_id: '00000000-0000-0000-0000-000000000001',
  title: 'National fuel supply disruption',
  category: 'operational' as const,
  owner_id: '00000000-0000-0000-0000-000000000001',
  status: 'open' as const,
  inherent_likelihood: 4,
  inherent_impact: 5,
}

describe('risk actions role gate', () => {
  beforeEach(() => {
    mockUser = null
  })

  it('blocks unauthenticated risk creation', async () => {
    const result = await createRisk(baseRiskInput)
    expect(result).toEqual({ error: 'Unauthorized.' })
  })

  it('blocks non-write role', async () => {
    mockUser = { id: 'u-1', app_metadata: { active_role: 'board-member', institution_id: 'inst-1' } }
    const result = await createRisk(baseRiskInput)
    expect(result).toEqual({ error: 'You do not have permission to modify risks.' })
  })

  it('allows risk-officer role', async () => {
    mockUser = { id: 'u-1', app_metadata: { active_role: 'risk-officer', institution_id: 'inst-1' } }
    const result = await createRisk(baseRiskInput)
    expect('data' in result).toBe(true)
  })
})

describe('risk actions overdue escalation branch', () => {
  beforeEach(() => {
    mockUser = { id: 'u-1', app_metadata: { active_role: 'risk-officer', institution_id: 'inst-1' } }
  })

  it('supports inline status update flow', async () => {
    const result = await updateRiskTreatmentStatus('t-1', { status: 'in_progress' })
    expect('data' in result).toBe(true)
  })
}
)
