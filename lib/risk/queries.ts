// lib/risk/queries.ts
// Query helpers for risk register/detail/heatmap pages.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type DbClient = SupabaseClient<Database>

export async function listRisks(supabase: DbClient) {
  const { data, error } = await supabase
    .from('risks')
    .select(
      `
      id,
      objective_id,
      title,
      description,
      category,
      owner_id,
      status,
      inherent_likelihood,
      inherent_impact,
      residual_likelihood,
      residual_impact,
      created_at,
      strategic_objectives!objective_id ( id, title ),
      user_profiles!owner_id ( first_name, last_name ),
      risk_treatments ( id, status )
      `,
    )
    .order('created_at', { ascending: false })

  return { data: data ?? [], error }
}

export async function getRiskById(supabase: DbClient, riskId: string) {
  const { data, error } = await supabase
    .from('risks')
    .select(
      `
      id,
      objective_id,
      title,
      description,
      category,
      owner_id,
      status,
      inherent_likelihood,
      inherent_impact,
      residual_likelihood,
      residual_impact,
      mitigating_controls,
      created_at,
      updated_at,
      strategic_objectives!objective_id ( id, title ),
      user_profiles!owner_id ( first_name, last_name )
      `,
    )
    .eq('id', riskId)
    .single()

  return { data, error }
}

export async function listRiskTreatments(supabase: DbClient, riskId: string) {
  const { data, error } = await supabase
    .from('risk_treatments')
    .select(
      `
      id,
      risk_id,
      title,
      description,
      owner_id,
      due_date,
      status,
      created_at,
      updated_at,
      user_profiles!owner_id ( first_name, last_name )
      `,
    )
    .eq('risk_id', riskId)
    .order('due_date', { ascending: true })

  return { data: data ?? [], error }
}

export async function listRiskHeatmapPoints(supabase: DbClient) {
  const { data, error } = await supabase
    .from('risks')
    .select('id, title, status, inherent_likelihood, inherent_impact')
    .neq('status', 'closed')

  return { data: data ?? [], error }
}

export async function listRiskOwners(supabase: DbClient) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, active_role, status')
    .eq('status', 'approved')
    .order('last_name')

  return { data: data ?? [], error }
}

export async function listObjectiveOptions(supabase: DbClient) {
  const { data, error } = await supabase
    .from('strategic_objectives')
    .select('id, title')
    .order('title')

  return { data: data ?? [], error }
}
