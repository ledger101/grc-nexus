// lib/compliance/queries.ts
// Query helpers for compliance list, detail, dashboard, and escalation views.
// Mirrors lib/risk/queries.ts pattern exactly.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { RegulatoryFramework } from '@/types/compliance'

type DbClient = SupabaseClient<Database>

// Typed shape for escalation targets — compliance_obligations is not yet in generated types
// (types/supabase.ts will be regenerated after supabase db pull in a future plan)
export interface ObligationEscalationTarget {
  id: string
  title: string
  due_date: string
  owner_id: string | null
  institution_id: string
  framework: RegulatoryFramework
}

/**
 * List all obligations for the authenticated user's institution.
 * Ordered by due_date ascending (earliest first for priority display).
 * Joins user_profiles for owner name (denormalized for TanStack Table).
 */
export async function listObligations(supabase: DbClient) {
  const { data, error } = await supabase
    .from('compliance_obligations')
    .select(`
      id, institution_id, framework, framework_reference,
      title, description, owner_id, due_date, status, created_at,
      user_profiles!owner_id ( first_name, last_name )
    `)
    .order('due_date', { ascending: true })

  return { data: data ?? [], error }
}

/**
 * Get a single obligation by ID with full detail including created_by profile.
 * Returns null in data when not found (RLS enforces institution scoping).
 */
export async function getObligationById(supabase: DbClient, obligationId: string) {
  const { data, error } = await supabase
    .from('compliance_obligations')
    .select(`
      id, institution_id, framework, framework_reference,
      title, description, owner_id, due_date, status, created_by, created_at, updated_at,
      user_profiles!owner_id ( first_name, last_name )
    `)
    .eq('id', obligationId)
    .single()

  return { data, error }
}

/**
 * List evidence files for an obligation, ordered by upload date ascending.
 * Joins user_profiles for uploader name display.
 */
export async function listEvidence(supabase: DbClient, obligationId: string) {
  const { data, error } = await supabase
    .from('obligation_evidence')
    .select(`
      id, obligation_id, storage_path, original_filename, mime_type,
      file_size_bytes, sha256_hash, uploaded_by, uploaded_at,
      user_profiles!uploaded_by ( first_name, last_name )
    `)
    .eq('obligation_id', obligationId)
    .order('uploaded_at', { ascending: true })

  return { data: data ?? [], error }
}

/**
 * List attestations for an obligation, ordered by attested_at descending (newest first).
 * Append-only table — no attestation can be modified after insertion (D-19).
 */
export async function listAttestations(supabase: DbClient, obligationId: string) {
  const { data, error } = await supabase
    .from('obligation_attestations')
    .select(`
      id, obligation_id, attestation_status, attested_by, attested_at, notes,
      user_profiles!attested_by ( first_name, last_name )
    `)
    .eq('obligation_id', obligationId)
    .order('attested_at', { ascending: false })

  return { data: data ?? [], error }
}

/**
 * Dashboard posture stats — three parallel queries (D-21, Pattern 7).
 * Returns:
 *   - obligations: full status array for distribution chart
 *   - overdueCount: obligations past due_date and not compliant/waived
 *   - expiringCount: obligations due within 30 days and not compliant/waived
 */
export async function getComplianceStats(supabase: DbClient) {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [statusResult, overdueResult, expiringResult] = await Promise.all([
    supabase.from('compliance_obligations').select('status'),
    supabase
      .from('compliance_obligations')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', today)
      .not('status', 'in', '("compliant","waived")'),
    supabase
      .from('compliance_obligations')
      .select('*', { count: 'exact', head: true })
      .gte('due_date', today)
      .lte('due_date', thirtyDaysOut)
      .not('status', 'in', '("compliant","waived")'),
  ])

  return {
    obligations: statusResult.data ?? [],
    overdueCount: overdueResult.count ?? 0,
    expiringCount: expiringResult.count ?? 0,
  }
}

/**
 * List obligations that match one of the three escalation thresholds.
 * Returns obligations with owner_id for email dispatch in escalation.ts.
 * Thresholds: due within 3 days (early warning), due today, 7+ days overdue (critical).
 * Excludes compliant and waived obligations (terminal states).
 */
export async function getObligationsForEscalation(supabase: DbClient) {
  const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Fetch obligations due within 3 days AND all past-due obligations (no lower bound on due_date).
  // escalation.ts calls getEscalationThreshold() per row and skips those returning null.
  //
  // INTENTIONAL GAP (ME-02, D-26): obligations that are 1–6 days past due fall outside all
  // three threshold buckets (early_warning covers pre-due, due_today covers day-of,
  // critical_overdue covers 7+ days past). These rows are fetched here but skipped by
  // escalation.ts. This matches the three-bucket design in D-26.
  // To add day-by-day overdue alerts, update getEscalationThreshold() in compliance-utils.ts
  // to return an 'overdue' bucket for diff values in the range [-6, -1].
  const { data, error } = await supabase
    .from('compliance_obligations')
    .select('id, title, due_date, owner_id, institution_id, framework')
    .lte('due_date', threeDaysOut)
    .not('status', 'in', '("compliant","waived")')
    .order('due_date', { ascending: true })

  return { data: (data ?? []) as ObligationEscalationTarget[], error }
}
