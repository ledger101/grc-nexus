import { createClient } from '@/lib/supabase/server'

export async function fetchGovernanceSummaryData(supabase: any, institutionId: string) {
  const [
    { count: openRisks },
    { count: nonCompliant },
    { count: pendingActions },
    { count: openIncidents },
    { count: openFindings },
    kpiResult,
  ] = await Promise.all([
    supabase.from('risks').select('*', { count: 'exact', head: true }).eq('treatment_status', 'Open').eq('institution_id', institutionId),
    supabase.from('compliance_obligations').select('*', { count: 'exact', head: true }).eq('status', 'Non-Compliant').eq('institution_id', institutionId),
    supabase.from('board_actions').select('*', { count: 'exact', head: true }).in('status', ['Pending', 'Overdue']).eq('institution_id', institutionId),
    supabase.from('incidents').select('*', { count: 'exact', head: true }).neq('status', 'Closed').eq('institution_id', institutionId),
    supabase.from('audit_findings').select('*', { count: 'exact', head: true }).in('status', ['Open', 'Overdue']).eq('institution_id', institutionId),
    supabase.from('kpis').select('actual_value, target_value').eq('institution_id', institutionId),
  ])

  const kpiAttainment = kpiResult.data?.length
    ? Math.round(kpiResult.data.reduce((sum: number, k: any) => sum + ((k.actual_value || 0) / (k.target_value || 1)) * 100, 0) / kpiResult.data.length)
    : 0

  const [{ data: risks }, { data: compliance }, { data: actions }] = await Promise.all([
    supabase.from('risks').select('risk_id, title, category, inherent_likelihood, inherent_impact, treatment_status').eq('institution_id', institutionId).order('inherent_likelihood', { ascending: false }).limit(10),
    supabase.from('compliance_obligations').select('regulation, obligation, status').eq('institution_id', institutionId).order('status', { ascending: false }).limit(10),
    supabase.from('board_actions').select('description, due_date, status').eq('institution_id', institutionId).in('status', ['Pending', 'Overdue']).order('due_date', { ascending: true }).limit(10),
  ])

  return {
    stats: {
      openRisks: openRisks || 0, nonCompliant: nonCompliant || 0,
      pendingActions: pendingActions || 0, kpiAttainment,
      openIncidents: openIncidents || 0, openFindings: openFindings || 0,
    },
    risks: (risks || []).map((r: any) => ({ ...r, inherent_score: (r.inherent_likelihood || 0) * (r.inherent_impact || 0) })),
    compliance: compliance || [],
    actions: actions || [],
  }
}

export async function fetchRiskRegisterData(supabase: any, institutionId: string) {
  const { data: risks, error } = await supabase
    .from('risks')
    .select('risk_id, title, category, inherent_likelihood, inherent_impact, residual_likelihood, residual_impact, treatment_status, risk_owner_id, user_profiles(name)')
    .eq('institution_id', institutionId)
    .order('inherent_likelihood', { ascending: false })

  if (error) throw error

  const risksWithOwner = (risks || []).map((r: any) => ({
    ...r,
    owner_name: r.user_profiles?.name || 'Unassigned',
    inherent_score: (r.inherent_likelihood || 0) * (r.inherent_impact || 0),
    residual_score: (r.residual_likelihood || 0) * (r.residual_impact || 0),
  }))

  return {
    risks: risksWithOwner,
    period: 'Current',
  }
}

export async function fetchComplianceData(supabase: any, institutionId: string) {
  const { data: obligations, error } = await supabase
    .from('compliance_obligations')
    .select('regulation, obligation, due_date, status, owner_id, user_profiles(name)')
    .eq('institution_id', institutionId)
    .order('status', { ascending: false })

  if (error) throw error

  const stats = {
    total: obligations?.length || 0,
    compliant: obligations?.filter((o: any) => o.status === 'Compliant').length || 0,
    nonCompliant: obligations?.filter((o: any) => o.status === 'Non-Compliant').length || 0,
    dueSoon: obligations?.filter((o: any) => o.status === 'Due Soon').length || 0,
  }

  const byRegulation: Record<string, { regulation: string; total: number; compliant: number; nonCompliant: number; dueSoon: number }> = {}
  obligations?.forEach((o: any) => {
    if (!byRegulation[o.regulation]) {
      byRegulation[o.regulation] = { regulation: o.regulation, total: 0, compliant: 0, nonCompliant: 0, dueSoon: 0 }
    }
    byRegulation[o.regulation].total++
    if (o.status === 'Compliant') byRegulation[o.regulation].compliant++
    else if (o.status === 'Non-Compliant') byRegulation[o.regulation].nonCompliant++
    else if (o.status === 'Due Soon') byRegulation[o.regulation].dueSoon++
  })

  return {
    stats,
    obligations: (obligations || []).map((o: any) => ({ ...o, owner_name: o.user_profiles?.name || 'Unassigned' })),
    byRegulation: Object.values(byRegulation),
  }
}

export async function fetchBoardActionsData(supabase: any, institutionId: string) {
  const { data: actions, error } = await supabase
    .from('board_actions')
    .select('description, due_date, status, meeting_id, assigned_to, board_meetings(title), user_profiles(name)')
    .eq('institution_id', institutionId)
    .order('due_date', { ascending: true })

  if (error) throw error

  const stats = {
    total: actions?.length || 0,
    pending: actions?.filter((a: any) => a.status === 'Pending').length || 0,
    inProgress: actions?.filter((a: any) => a.status === 'In Progress').length || 0,
    overdue: actions?.filter((a: any) => a.status === 'Overdue').length || 0,
    completed: actions?.filter((a: any) => a.status === 'Completed').length || 0,
  }

  return {
    stats,
    actions: (actions || []).map((a: any) => ({
      ...a,
      meeting_title: a.board_meetings?.title || '—',
      assigned_to_name: a.user_profiles?.name || 'Unassigned',
    })),
  }
}

export async function fetchQuarterlyRiskCommitteePackData(supabase: any, institutionId: string) {
  // Risk stats
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [
    { count: totalRisks },
    { data: allRisks },
    { data: emergingRisks },
    { count: openMitigations },
    { data: kris },
    { data: mitigations },
    { data: incidents },
    { data: riskAppetite },
  ] = await Promise.all([
    supabase.from('risks').select('*', { count: 'exact', head: true }).eq('institution_id', institutionId),
    supabase.from('risks').select('id, risk_id, title, category, inherent_likelihood, inherent_impact, residual_likelihood, residual_impact, treatment_status, risk_owner_id, user_profiles(name)').eq('institution_id', institutionId),
    supabase.from('risks').select('id, risk_id, title, category, inherent_likelihood, inherent_impact, treatment_status, risk_owner_id, user_profiles(name), created_at').eq('institution_id', institutionId).gte('created_at', ninetyDaysAgo.toISOString()),
    supabase.from('risk_treatments').select('*', { count: 'exact', head: true }).in('status', ['planned', 'in_progress', 'overdue']).eq('institution_id', institutionId),
    supabase.from('kri_readings').select('id, actual_value, status, kri_definitions(id, title, unit_of_measure, alert_threshold, direction), recorded_at').eq('institution_id', institutionId).order('recorded_at', { ascending: false }).limit(10),
    supabase.from('risk_treatments').select('id, title, description, due_date, status, owner_id, user_profiles(name)').eq('institution_id', institutionId).in('status', ['planned', 'in_progress', 'overdue']).order('due_date', { ascending: true }),
    supabase.from('incidents').select('id, title, category, severity, status, incident_date, reported_at, root_cause_risk_id').eq('institution_id', institutionId).neq('status', 'Closed').order('reported_at', { ascending: false }).limit(20),
    supabase.from('risk_appetite_statements').select('id, category, appetite_limit, actual_exposure, variance, status').eq('institution_id', institutionId).order('category', { ascending: true }),
  ])

  // Compute heatmap buckets
  const risksWithScore = (allRisks || []).map((r: any) => ({
    ...r,
    owner_name: r.user_profiles?.name || 'Unassigned',
    inherent_score: (r.inherent_likelihood || 0) * (r.inherent_impact || 0),
  }))

  const critical = risksWithScore.filter((r: any) => r.inherent_score >= 15).length
  const high = risksWithScore.filter((r: any) => r.inherent_score >= 10 && r.inherent_score < 15).length
  const medium = risksWithScore.filter((r: any) => r.inherent_score >= 5 && r.inherent_score < 10).length
  const low = risksWithScore.filter((r: any) => r.inherent_score < 5).length
  const total = risksWithScore.length || 1

  const heatmap = {
    critical,
    high,
    medium,
    low,
    criticalPercent: Math.round((critical / total) * 100),
    highPercent: Math.round((high / total) * 100),
    mediumPercent: Math.round((medium / total) * 100),
    lowPercent: Math.round((low / total) * 100),
  }

  // Emerging risks
  const emergingMapped = (emergingRisks || []).map((r: any) => ({
    ...r,
    owner_name: r.user_profiles?.name || 'Unassigned',
    inherent_score: (r.inherent_likelihood || 0) * (r.inherent_impact || 0),
    trend: 'stable',
  }))

  // KRI rows
  const kriRows = (kris || []).map((k: any) => {
    const def = k.kri_definitions || {}
    const threshold = def.alert_threshold || 0
    const actual = k.actual_value || 0
    const direction = def.direction || 'lower_is_worse'
    let breachStatus = 'on_track'
    if (direction === 'lower_is_worse') {
      breachStatus = actual >= threshold ? 'breached' : 'on_track'
    } else {
      breachStatus = actual <= threshold ? 'breached' : 'on_track'
    }
    return {
      title: def.title || '—',
      unit: def.unit_of_measure || '',
      currentReading: actual,
      threshold,
      breachStatus,
      trend: 'stable',
    }
  })

  // Mitigations
  const mitigationsMapped = (mitigations || []).map((m: any) => ({
    ...m,
    owner_name: m.user_profiles?.name || 'Unassigned',
    progress: 0,
  }))

  // Incident-to-risk mapping
  const incidentRiskMap = (incidents || []).map((i: any) => ({
    incident_title: i.title || '—',
    incident_date: i.incident_date || i.reported_at || '—',
    severity: i.severity || 'low',
    linked_risk_title: '—',
    linked_risk_id: i.root_cause_risk_id || '—',
  }))

  return {
    stats: {
      totalRisks: totalRisks || 0,
      criticalRisks: critical,
      highRisks: high,
      openMitigations: openMitigations || 0,
    },
    heatmap,
    emergingRisks: emergingMapped,
    kris: kriRows,
    mitigations: mitigationsMapped,
    incidentRiskMap,
    riskAppetite: riskAppetite || [],
    forwardRisks: [],
    upcomingRegulations: [],
    plannedAudits: [],
  }
}

export async function fetchAnnualCorporateGovernanceReturnData(supabase: any, institutionId: string) {
  // Fetch all required data sections
  const [
    { data: boardMembers },
    { data: boardMeetings },
    { data: committees },
    { data: allRisks },
    { data: complianceObligations },
    { data: auditFindings },
    { data: incidents },
    { data: strategicObjectives },
    { data: kpis },
    { data: kpiReadings },
  ] = await Promise.all([
    supabase.from('board_members').select('id, name, role, is_independent, appointment_date, tenure_years, status').eq('institution_id', institutionId).eq('status', 'active').order('role', { ascending: true }),
    supabase.from('board_meetings').select('id, title, meeting_date, attendance_rate, quorum_met, minutes_status').eq('institution_id', institutionId).order('meeting_date', { ascending: true }),
    supabase.from('board_committees').select('id, name, chair_name, members, meetings_held, status').eq('institution_id', institutionId).order('name', { ascending: true }),
    supabase.from('risks').select('id, risk_id, title, category, inherent_likelihood, inherent_impact, treatment_status').eq('institution_id', institutionId).order('inherent_likelihood', { ascending: false }),
    supabase.from('compliance_obligations').select('id, regulation, framework, title, description, status, due_date').eq('institution_id', institutionId).order('status', { ascending: false }),
    supabase.from('audit_findings').select('id, title, severity, status, due_date, review_date').eq('institution_id', institutionId).order('severity', { ascending: false }),
    supabase.from('incidents').select('id, title, category, severity, status, incident_date').eq('institution_id', institutionId).order('incident_date', { ascending: false }),
    supabase.from('strategic_objectives').select('id, title, status, progress_percentage').eq('institution_id', institutionId).order('title', { ascending: true }),
    supabase.from('kpis').select('id, title, actual_value, target_value, unit_of_measure').eq('institution_id', institutionId).order('title', { ascending: true }),
    supabase.from('kpi_readings').select('id, kpi_id, actual_value, recorded_at').eq('institution_id', institutionId).order('recorded_at', { ascending: false }),
  ])

  // Board stats
  const totalBoard = (boardMembers || []).length
  const independentCount = (boardMembers || []).filter((m: any) => m.is_independent).length
  const boardMapped = (boardMembers || []).map((m: any) => ({
    ...m,
    isIndependent: m.is_independent ? 'Yes' : 'No',
    appointmentDate: m.appointment_date || '—',
    tenureYears: m.tenure_years || '—',
  }))

  // Meeting stats
  const meetingsMapped = (boardMeetings || []).map((m: any) => ({
    ...m,
    attendanceRate: m.attendance_rate || 0,
    quorumMet: m.quorum_met ? 'Yes' : 'No',
    minutesStatus: m.minutes_status || 'Pending',
  }))

  // Committee stats
  const committeesMapped = (committees || []).map((c: any) => ({
    ...c,
    chair: c.chair_name || '—',
    members: Array.isArray(c.members) ? c.members.length : (c.members || '—'),
    meetingsHeld: c.meetings_held || 0,
  }))

  // Risk stats
  const risksWithScore = (allRisks || []).map((r: any) => ({
    ...r,
    inherent_score: (r.inherent_likelihood || 0) * (r.inherent_impact || 0),
  }))
  const criticalRisks = risksWithScore.filter((r: any) => r.inherent_score >= 15)
  const highRisks = risksWithScore.filter((r: any) => r.inherent_score >= 10 && r.inherent_score < 15)

  const riskStats = {
    total: risksWithScore.length,
    critical: criticalRisks.length,
    high: highRisks.length,
    coverage: risksWithScore.length > 0 ? 100 : 0,
  }

  // Compliance stats
  const totalComp = (complianceObligations || []).length
  const compCompliant = (complianceObligations || []).filter((o: any) => o.status === 'compliant' || o.status === 'Compliant').length
  const compNonCompliant = (complianceObligations || []).filter((o: any) => o.status === 'non_compliant' || o.status === 'Non-Compliant').length

  const complianceByRegulation: Record<string, { regulation: string; total: number; compliant: number; nonCompliant: number; percent: string }> = {}
  ;(complianceObligations || []).forEach((o: any) => {
    const reg = o.regulation || o.framework || 'Other'
    if (!complianceByRegulation[reg]) {
      complianceByRegulation[reg] = { regulation: reg, total: 0, compliant: 0, nonCompliant: 0, percent: '0%' }
    }
    complianceByRegulation[reg].total++
    if (o.status === 'compliant' || o.status === 'Compliant') complianceByRegulation[reg].compliant++
    else if (o.status === 'non_compliant' || o.status === 'Non-Compliant') complianceByRegulation[reg].nonCompliant++
  })
  Object.values(complianceByRegulation).forEach((r: any) => {
    r.percent = `${r.total > 0 ? Math.round((r.compliant / r.total) * 100) : 0}%`
  })

  const nonCompliantItems = (complianceObligations || [])
    .filter((o: any) => o.status === 'non_compliant' || o.status === 'Non-Compliant')
    .map((o: any) => ({
      regulation: o.regulation || o.framework || 'Other',
      obligation: o.title || o.description || '—',
      remediation: 'Remediation plan pending',
      due_date: o.due_date || '—',
    }))

  // Audit stats
  const openFindings = (auditFindings || []).filter((f: any) => f.status === 'open' || f.status === 'Open').length
  const closedFindings = (auditFindings || []).filter((f: any) => f.status === 'closed' || f.status === 'Closed').length
  const auditFindingsMapped = (auditFindings || []).map((f: any) => ({
    ...f,
    remediationStatus: f.status === 'closed' || f.status === 'Closed' ? 'Closed' : 'Open',
  }))

  const auditStats = {
    planCoverage: 100,
    openFindings,
    closedFindings,
    responseRate: 100,
  }

  // Incident stats
  const totalIncidents = (incidents || []).length
  const fraudIncidents = (incidents || []).filter((i: any) => i.category === 'fraud' || i.category === 'Fraud').length
  const cyberIncidents = (incidents || []).filter((i: any) => i.category === 'cyber' || i.category === 'Cyber').length
  const governanceIncidents = (incidents || []).filter((i: any) => i.category === 'governance' || i.category === 'Governance').length

  const incidentsByCategory: Record<string, { category: string; count: number; severity: string }> = {}
  ;(incidents || []).forEach((i: any) => {
    const cat = i.category || 'Other'
    if (!incidentsByCategory[cat]) {
      incidentsByCategory[cat] = { category: cat, count: 0, severity: i.severity || 'low' }
    }
    incidentsByCategory[cat].count++
    if (['critical', 'high'].includes(i.severity)) {
      incidentsByCategory[cat].severity = i.severity
    }
  })

  // Strategic stats
  const totalObjectives = (strategicObjectives || []).length
  const avgProgress = totalObjectives > 0
    ? Math.round((strategicObjectives || []).reduce((sum: number, o: any) => sum + (o.progress_percentage || 0), 0) / totalObjectives)
    : 0

  const kpiAttainment = (kpis || []).length > 0
    ? Math.round((kpis || []).reduce((sum: number, k: any) => {
        const val = (k.actual_value || 0) / (k.target_value || 1) * 100
        return sum + (isFinite(val) ? val : 0)
      }, 0) / (kpis || []).length)
    : 0

  const strategicStats = {
    progress: avgProgress,
    kpiAttainment,
    achievements: totalObjectives,
    missed: 0,
  }

  const objectivesMapped = (strategicObjectives || []).map((o: any) => ({
    ...o,
    achievement: (o.progress_percentage || 0) >= 100 ? 'Achieved' : 'In Progress',
  }))

  return {
    boardMembers: boardMapped,
    boardMeetings: meetingsMapped,
    committees: committeesMapped,
    riskStats,
    riskFrameworkSummary: '',
    riskAppetiteStatement: '',
    topRisks: risksWithScore,
    complianceStats: {
      total: totalComp,
      compliant: compCompliant,
      nonCompliant: compNonCompliant,
      percent: totalComp > 0 ? Math.round((compCompliant / totalComp) * 100) : 0,
    },
    complianceByRegulation: Object.values(complianceByRegulation),
    nonCompliantItems,
    auditStats,
    auditFindings: auditFindingsMapped,
    incidentStats: {
      total: totalIncidents,
      fraud: fraudIncidents,
      cyber: cyberIncidents,
      governance: governanceIncidents,
    },
    incidentsByCategory: Object.values(incidentsByCategory),
    whistleblowerStats: {
      received: 0,
      investigated: 0,
      substantiated: 0,
      unsubstantiated: 0,
    },
    strategicStats,
    strategicObjectives: objectivesMapped,
    financialStats: {
      budgetVariance: '0%',
      auditOpinion: 'Unqualified',
      controlRating: 'Effective',
    },
    budgetLines: [],
    complianceOfficer: '',
    boardChair: '',
    year: new Date().getFullYear(),
    submittedDate: new Date().toISOString(),
    registrationNumber: '',
  }
}

export async function fetchBoardMeetingPackData(supabase: any, institutionId: string) {
  // Fetch latest meeting for the institution
  const { data: meetings } = await supabase
    .from('board_meetings')
    .select('id, title, meeting_date, classification, location, agenda_items')
    .eq('institution_id', institutionId)
    .order('meeting_date', { ascending: false })
    .limit(1)

  const meeting = meetings?.[0] || null

  // Fetch board members for this meeting
  let boardMembers: any[] = []
  if (meeting) {
    const { data: attendees } = await supabase
      .from('board_meeting_attendees')
      .select('role, attendance_status, user_profiles(first_name, last_name, active_role)')
      .eq('meeting_id', meeting.id)
    boardMembers = (attendees || []).map((a: any) => ({
      name: `${a.user_profiles?.first_name || ''} ${a.user_profiles?.last_name || ''}`.trim() || 'Unknown',
      role: a.role || 'Member',
      attendance: a.attendance_status || 'TBC',
    }))
  }

  // Fetch governance stats (same as RPT-001)
  const [
    { count: openRisks },
    { count: nonCompliant },
    { count: pendingActions },
    { count: openIncidents },
    { count: openFindings },
    kpiResult,
  ] = await Promise.all([
    supabase.from('risks').select('*', { count: 'exact', head: true }).eq('treatment_status', 'Open').eq('institution_id', institutionId),
    supabase.from('compliance_obligations').select('*', { count: 'exact', head: true }).eq('status', 'Non-Compliant').eq('institution_id', institutionId),
    supabase.from('board_actions').select('*', { count: 'exact', head: true }).in('status', ['Pending', 'Overdue']).eq('institution_id', institutionId),
    supabase.from('incidents').select('*', { count: 'exact', head: true }).neq('status', 'Closed').eq('institution_id', institutionId),
    supabase.from('audit_findings').select('*', { count: 'exact', head: true }).in('status', ['Open', 'Overdue']).eq('institution_id', institutionId),
    supabase.from('kpis').select('actual_value, target_value').eq('institution_id', institutionId),
  ])

  const kpiAttainment = kpiResult.data?.length
    ? Math.round(kpiResult.data.reduce((sum: number, k: any) => sum + ((k.actual_value || 0) / (k.target_value || 1)) * 100, 0) / kpiResult.data.length)
    : 0

  // Fetch top 20 risks by inherent score
  const { data: risks } = await supabase
    .from('risks')
    .select('risk_id, title, category, inherent_likelihood, inherent_impact, residual_likelihood, residual_impact, treatment_status, risk_owner_id, user_profiles(name)')
    .eq('institution_id', institutionId)
    .order('inherent_likelihood', { ascending: false })
    .limit(20)

  const risksWithScore = (risks || []).map((r: any) => ({
    ...r,
    owner_name: r.user_profiles?.name || 'Unassigned',
    inherent_score: (r.inherent_likelihood || 0) * (r.inherent_impact || 0),
    residual_score: (r.residual_likelihood || 0) * (r.residual_impact || 0),
  }))

  // Fetch compliance obligations
  const { data: obligations } = await supabase
    .from('compliance_obligations')
    .select('regulation, obligation, due_date, status, owner_id, user_profiles(name)')
    .eq('institution_id', institutionId)
    .order('status', { ascending: false })

  const complianceStats = {
    total: obligations?.length || 0,
    compliant: obligations?.filter((o: any) => o.status === 'Compliant').length || 0,
    nonCompliant: obligations?.filter((o: any) => o.status === 'Non-Compliant').length || 0,
    dueSoon: obligations?.filter((o: any) => o.status === 'Due Soon').length || 0,
  }

  const byRegulation: Record<string, { regulation: string; total: number; compliant: number; nonCompliant: number; dueSoon: number }> = {}
  obligations?.forEach((o: any) => {
    if (!byRegulation[o.regulation]) {
      byRegulation[o.regulation] = { regulation: o.regulation, total: 0, compliant: 0, nonCompliant: 0, dueSoon: 0 }
    }
    byRegulation[o.regulation].total++
    if (o.status === 'Compliant') byRegulation[o.regulation].compliant++
    else if (o.status === 'Non-Compliant') byRegulation[o.regulation].nonCompliant++
    else if (o.status === 'Due Soon') byRegulation[o.regulation].dueSoon++
  })

  const nonCompliantItems = (obligations || [])
    .filter((o: any) => o.status === 'Non-Compliant')
    .map((o: any) => ({ ...o, owner_name: o.user_profiles?.name || 'Unassigned' }))

  // Fetch board actions
  const { data: actions } = await supabase
    .from('board_actions')
    .select('description, due_date, status, meeting_id, assigned_to, board_meetings(title), user_profiles(name)')
    .eq('institution_id', institutionId)
    .order('due_date', { ascending: true })

  const actionStats = {
    total: actions?.length || 0,
    pending: actions?.filter((a: any) => a.status === 'Pending').length || 0,
    inProgress: actions?.filter((a: any) => a.status === 'In Progress').length || 0,
    overdue: actions?.filter((a: any) => a.status === 'Overdue').length || 0,
    completed: actions?.filter((a: any) => a.status === 'Completed').length || 0,
  }

  const actionsMapped = (actions || []).map((a: any) => ({
    ...a,
    meeting_title: a.board_meetings?.title || '—',
    assigned_to_name: a.user_profiles?.name || 'Unassigned',
  }))

  // Fetch audit findings
  const { data: findings } = await supabase
    .from('audit_findings')
    .select('id, title, description, severity, status, due_date, owner_id, user_profiles(name)')
    .eq('institution_id', institutionId)
    .in('status', ['Open', 'Overdue'])
    .order('severity', { ascending: false })

  const findingsMapped = (findings || []).map((f: any) => ({
    ...f,
    owner_name: f.user_profiles?.name || 'Unassigned',
  }))

  // Fetch incidents
  const { data: incidents } = await supabase
    .from('incidents')
    .select('id, title, description, status, severity, reported_at, incident_date')
    .eq('institution_id', institutionId)
    .neq('status', 'Closed')
    .order('reported_at', { ascending: false })
    .limit(20)

  // Fetch KPIs
  const { data: kpis } = await supabase
    .from('kpis')
    .select('id, name, actual_value, target_value, unit, status')
    .eq('institution_id', institutionId)
    .order('name', { ascending: true })

  // Fetch strategic objectives
  const { data: objectives } = await supabase
    .from('strategic_objectives')
    .select('id, title, description, status, progress_percentage')
    .eq('institution_id', institutionId)
    .order('title', { ascending: true })

  // Fetch previous meeting minutes (if applicable)
  let previousMinutes: any = null
  if (meeting) {
    const { data: prevMeetings } = await supabase
      .from('board_meetings')
      .select('id, title, meeting_date, minutes')
      .eq('institution_id', institutionId)
      .lt('meeting_date', meeting.meeting_date)
      .order('meeting_date', { ascending: false })
      .limit(1)
    previousMinutes = prevMeetings?.[0] || null
  }

  return {
    meeting,
    boardMembers,
    previousMinutes,
    stats: {
      openRisks: openRisks || 0,
      nonCompliant: nonCompliant || 0,
      pendingActions: pendingActions || 0,
      kpiAttainment,
      openIncidents: openIncidents || 0,
      openFindings: openFindings || 0,
    },
    risks: risksWithScore,
    compliance: {
      stats: complianceStats,
      obligations: (obligations || []).map((o: any) => ({ ...o, owner_name: o.user_profiles?.name || 'Unassigned' })),
      byRegulation: Object.values(byRegulation),
      nonCompliantItems,
    },
    actions: {
      stats: actionStats,
      actions: actionsMapped,
    },
    findings: findingsMapped,
    incidents: incidents || [],
    kpis: kpis || [],
    objectives: objectives || [],
  }
}

const FETCHERS: Record<string, Function> = {
  'rpt-001': fetchGovernanceSummaryData,
  'rpt-002': fetchRiskRegisterData,
  'rpt-005': fetchComplianceData,
  'rpt-007': fetchBoardMeetingPackData,
  'rpt-009': fetchBoardActionsData,
  'rpt-015': fetchQuarterlyRiskCommitteePackData,
  'rpt-020': fetchAnnualCorporateGovernanceReturnData,
}

export async function fetchReportData(templateId: string, supabase: any, institutionId: string) {
  const fetcher = FETCHERS[templateId]
  if (!fetcher) throw new Error(`No data fetcher for template: ${templateId}`)
  return await fetcher(supabase, institutionId)
}
