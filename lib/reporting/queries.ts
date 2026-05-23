import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { normalizeReportingFilters } from './filters'
import type { ExecutiveDashboardData, OverdueActionItem } from './types'

type DbClient = SupabaseClient<Database>

function isModuleEnabled(activeModule: string, candidate: string): boolean {
  return activeModule === 'all' || activeModule === candidate
}

export async function getExecutiveDashboardData(
  supabase: DbClient,
  filterInput: unknown,
): Promise<ExecutiveDashboardData> {
  const filters = normalizeReportingFilters(filterInput)
  const today = new Date().toISOString().slice(0, 10)

  const [
    objectivesResult,
    riskCountResult,
    riskPointsResult,
    obligationsStatusResult,
    overdueObligationsResult,
    expiringObligationsResult,
    incidentCountResult,
    boardOverdueResult,
    treatmentOverdueResult,
    incidentOverdueResult,
  ] = await Promise.all([
    isModuleEnabled(filters.module, 'strategic')
      ? supabase
          .from('strategic_objectives')
          .select('id', { count: 'exact', head: true })
      : Promise.resolve({ count: 0, data: null, error: null }),

    isModuleEnabled(filters.module, 'risk')
      ? supabase
          .from('risks')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'closed')
      : Promise.resolve({ count: 0, data: null, error: null }),

    isModuleEnabled(filters.module, 'risk')
      ? supabase
          .from('risks')
          .select('id, title, inherent_likelihood, inherent_impact')
          .neq('status', 'closed')
      : Promise.resolve({ data: [], error: null }),

    isModuleEnabled(filters.module, 'compliance')
      ? supabase.from('compliance_obligations').select('id')
      : Promise.resolve({ data: [], error: null }),

    isModuleEnabled(filters.module, 'compliance')
      ? supabase
          .from('compliance_obligations')
          .select('id', { count: 'exact', head: true })
          .lt('due_date', today)
          .not('status', 'in', '("compliant","waived")')
      : Promise.resolve({ count: 0, data: null, error: null }),

    isModuleEnabled(filters.module, 'compliance')
      ? supabase
          .from('compliance_obligations')
          .select('id', { count: 'exact', head: true })
          .gte('due_date', today)
          .lte('due_date', filters.to)
          .not('status', 'in', '("compliant","waived")')
      : Promise.resolve({ count: 0, data: null, error: null }),

    isModuleEnabled(filters.module, 'incidents')
      ? supabase
          .from('incident_cases')
          .select('id', { count: 'exact', head: true })
          .not('status', 'in', '("closed","dismissed")')
      : Promise.resolve({ count: 0, data: null, error: null }),

    isModuleEnabled(filters.module, 'board')
      ? supabase
          .from('board_action_items')
          .select('id, title, due_date, owner_id, status')
          .lt('due_date', today)
          .not('status', 'in', '("completed","cancelled")')
          .order('due_date', { ascending: true })
          .limit(10)
      : Promise.resolve({ data: [], error: null }),

    isModuleEnabled(filters.module, 'risk')
      ? supabase
          .from('risk_treatments')
          .select('id, title, due_date, owner_id, status')
          .lt('due_date', today)
          .not('status', 'in', '("completed","cancelled")')
          .order('due_date', { ascending: true })
          .limit(10)
      : Promise.resolve({ data: [], error: null }),

    isModuleEnabled(filters.module, 'incidents')
      ? supabase
          .from('incident_cases')
          .select('id, title, due_date, assigned_to, status')
          .lt('due_date', today)
          .not('status', 'in', '("closed","dismissed")')
          .order('due_date', { ascending: true })
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
  ])

  const overdueActions: OverdueActionItem[] = [
    ...((boardOverdueResult.data ?? []).map((row) => ({
      id: String((row as { id: string }).id),
      title: String((row as { title: string }).title),
      module: 'board' as const,
      dueDate: String((row as { due_date: string }).due_date),
      ownerId: ((row as { owner_id: string | null }).owner_id ?? null),
      status: String((row as { status: string }).status),
    }))),
    ...((treatmentOverdueResult.data ?? []).map((row) => ({
      id: String((row as { id: string }).id),
      title: String((row as { title: string }).title),
      module: 'risk' as const,
      dueDate: String((row as { due_date: string }).due_date),
      ownerId: ((row as { owner_id: string | null }).owner_id ?? null),
      status: String((row as { status: string }).status),
    }))),
    ...((incidentOverdueResult.data ?? []).map((row) => ({
      id: String((row as { id: string }).id),
      title: String((row as { title: string }).title),
      module: 'incidents' as const,
      dueDate: String((row as { due_date: string }).due_date),
      ownerId: ((row as { assigned_to: string | null }).assigned_to ?? null),
      status: String((row as { status: string }).status),
    }))),
  ]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 10)

  return {
    filters,
    kpi: {
      objectivesTotal: objectivesResult.count ?? 0,
      activeRisks: riskCountResult.count ?? 0,
      overdueObligations: overdueObligationsResult.count ?? 0,
      openIncidents: incidentCountResult.count ?? 0,
    },
    riskHeatmapPoints: (riskPointsResult.data ?? []).map((row) => {
      const riskRow = row as {
        id: string
        title: string
        inherent_likelihood: number
        inherent_impact: number
      }
      return {
        id: riskRow.id,
        title: riskRow.title,
        likelihood: riskRow.inherent_likelihood,
        impact: riskRow.inherent_impact,
      }
    }),
    compliance: {
      totalObligations: (obligationsStatusResult.data ?? []).length,
      overdueCount: overdueObligationsResult.count ?? 0,
      expiringCount: expiringObligationsResult.count ?? 0,
    },
    overdueActions,
  }
}
