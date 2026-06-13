import { COLORS, getStatusColor } from '../engine/branding'
import { createBrandedDocument, addPage, finalizeDocument, CONTENT_TOP, MARGIN, CONTENT_WIDTH, FOOTER_HEIGHT, PAGE_WIDTH } from '../engine/layout'
import { drawTable } from '../engine/tables'

function scoreHeatmapColor(score: number) {
  if (score >= 15) return COLORS.red
  if (score >= 10) return COLORS.orange
  if (score >= 5) return COLORS.gold
  return COLORS.green
}

function drawSectionHeader(page: any, fonts: any, y: number, title: string) {
  page.drawText(title, { x: MARGIN, y, size: 16, font: fonts.helveticaBold, color: COLORS.navy })
  y -= 20
  page.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 1, color: COLORS.gold,
  })
  y -= 16
  return y
}

function drawEmptyState(page: any, fonts: any, y: number, message: string) {
  page.drawText(message, {
    x: MARGIN, y, size: 10, font: fonts.helveticaOblique, color: COLORS.mediumGray,
  })
  return y - 20
}

function checkPageBreak(doc: any, page: any, y: number, needed = 120) {
  if (y - needed < FOOTER_HEIGHT + 20) {
    return { page: addPage(doc), y: CONTENT_TOP }
  }
  return { page, y }
}

function drawStatCards(page: any, fonts: any, y: number, cards: { label: string; value: string; color: any }[]) {
  const cardWidth = CONTENT_WIDTH / 3 - 10
  const cardHeight = 55
  let cardCol = 0
  let cardRowY = y
  cards.forEach(card => {
    const cardX = MARGIN + (cardCol * (cardWidth + 15))
    page.drawRectangle({
      x: cardX, y: cardRowY - cardHeight, width: cardWidth, height: cardHeight,
      color: COLORS.paper, borderColor: COLORS.lightGray, borderWidth: 0.5,
    })
    page.drawRectangle({
      x: cardX, y: cardRowY - cardHeight, width: 4, height: cardHeight,
      color: card.color,
    })
    page.drawText(card.label, {
      x: cardX + 12, y: cardRowY - 18,
      size: 9, font: fonts.helvetica, color: COLORS.mediumGray,
    })
    page.drawText(card.value, {
      x: cardX + 12, y: cardRowY - 38,
      size: 18, font: fonts.helveticaBold, color: COLORS.navy,
    })
    cardCol++
    if (cardCol === 3) { cardCol = 0; cardRowY -= (cardHeight + 12) }
  })
  return cardRowY - (cardCol > 0 ? cardHeight + 12 : 0)
}

function drawTocItem(page: any, fonts: any, y: number, label: string, pageNum: number, level = 0) {
  const indent = level * 16
  const labelWidth = fonts.helvetica.widthOfTextAtSize(label, 10)
  const numText = String(pageNum)
  const numWidth = fonts.helvetica.widthOfTextAtSize(numText, 10)
  const dotsWidth = CONTENT_WIDTH - labelWidth - numWidth - indent - 20
  const dots = '.'.repeat(Math.max(0, Math.floor(dotsWidth / 3)))

  page.drawText(label, {
    x: MARGIN + indent, y, size: 10, font: fonts.helvetica, color: COLORS.black,
  })
  page.drawText(dots, {
    x: MARGIN + indent + labelWidth + 4, y, size: 10, font: fonts.helvetica, color: COLORS.lightGray,
  })
  page.drawText(numText, {
    x: PAGE_WIDTH - MARGIN - numWidth, y, size: 10, font: fonts.helveticaBold, color: COLORS.navy,
  })
  return y - 18
}

export async function buildBoardMeetingPackPdf(data: any, metadata: any = {}) {
  const doc = await createBrandedDocument({
    reportTitle: 'Board Meeting Pack',
    reportId: 'RPT-007',
    classification: data?.meeting?.classification || 'CONFIDENTIAL — BOARD USE ONLY',
    ...metadata,
  })

  const { fonts } = doc
  const sections: { name: string; page: number; level?: number }[] = []

  // ============================================================
  // PAGE 1 — COVER
  // ============================================================
  const coverPage = await addPage(doc, true)
  let y = CONTENT_TOP + 40

  // Decorative gold bar at top
  coverPage.drawRectangle({
    x: 0, y: 841.89 - 8, width: 595.28, height: 8, color: COLORS.gold,
  })

  // Institution
  coverPage.drawText(metadata.institution || 'Republic of Zimbabwe', {
    x: MARGIN, y, size: 11, font: fonts.helvetica, color: COLORS.mediumGray,
  })
  y -= 36

  // Report title
  coverPage.drawText('BOARD MEETING PACK', {
    x: MARGIN, y, size: 28, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 40

  // Meeting title
  const meetingTitle = data?.meeting?.title || 'Board Meeting'
  coverPage.drawText(meetingTitle, {
    x: MARGIN, y, size: 16, font: fonts.helveticaBold, color: COLORS.darkGray,
  })
  y -= 28

  // Meeting date
  const meetingDate = data?.meeting?.meeting_date
    ? new Date(data.meeting.meeting_date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  coverPage.drawText(`Date: ${meetingDate}`, {
    x: MARGIN, y, size: 12, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 22

  // Classification
  coverPage.drawText(`Classification: ${doc.metadata.classification}`, {
    x: MARGIN, y, size: 10, font: fonts.helveticaBold, color: COLORS.red,
  })
  y -= 40

  // Gold divider
  coverPage.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 1.5, color: COLORS.gold,
  })
  y -= 32

  // Board Members
  coverPage.drawText('Board Members in Attendance', {
    x: MARGIN, y, size: 14, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 26

  if (data?.boardMembers?.length > 0) {
    const members = data.boardMembers.map((m: any) => ({
      name: m.name, role: m.role, attendance: m.attendance,
    }))
    y = drawTable(coverPage, y, [
      { key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'attendance', label: 'Attendance' },
    ], members, fonts, { fontSize: 9, rowHeight: 20 })
  } else {
    y = drawEmptyState(coverPage, fonts, y, 'No board member attendance records available.')
  }

  y -= 24
  coverPage.drawText('Prepared by the Governance, Risk & Compliance Office', {
    x: MARGIN, y, size: 9, font: fonts.helveticaOblique, color: COLORS.mediumGray,
  })
  y -= 16
  coverPage.drawText('This document is classified and intended solely for board members.', {
    x: MARGIN, y, size: 8, font: fonts.helvetica, color: COLORS.mediumGray,
  })

  // ============================================================
  // PAGE 2 — TABLE OF CONTENTS (reserved, drawn later)
  // ============================================================
  const tocPage = await addPage(doc, false)

  // ============================================================
  // SECTION 1 — GOVERNANCE DASHBOARD
  // ============================================================
  let sectionPage = await addPage(doc, false)
  const dashboardPageNum = doc.pdfDoc.getPages().length
  sections.push({ name: 'Governance Dashboard', page: dashboardPageNum, level: 0 })
  y = CONTENT_TOP

  y = drawSectionHeader(sectionPage, fonts, y, '1. Governance Dashboard')

  const stats = data.stats || {}
  const cards = [
    { label: 'Open Risks', value: String(stats.openRisks || 0), color: (stats.openRisks || 0) > 5 ? COLORS.red : COLORS.navy },
    { label: 'Non-Compliant', value: String(stats.nonCompliant || 0), color: (stats.nonCompliant || 0) > 0 ? COLORS.red : COLORS.green },
    { label: 'Pending Actions', value: String(stats.pendingActions || 0), color: (stats.pendingActions || 0) > 3 ? COLORS.orange : COLORS.navy },
    { label: 'KPI Attainment', value: `${stats.kpiAttainment || 0}%`, color: (stats.kpiAttainment || 0) < 50 ? COLORS.red : COLORS.green },
    { label: 'Open Incidents', value: String(stats.openIncidents || 0), color: (stats.openIncidents || 0) > 0 ? COLORS.orange : COLORS.green },
    { label: 'Open Findings', value: String(stats.openFindings || 0), color: (stats.openFindings || 0) > 2 ? COLORS.orange : COLORS.green },
  ]
  y = drawStatCards(sectionPage, fonts, y, cards)
  y -= 28

  // Previous minutes reference
  if (data?.previousMinutes) {
    sectionPage.drawText('Previous Meeting Minutes', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 20
    const prevDate = new Date(data.previousMinutes.meeting_date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    sectionPage.drawText(`Reference: ${data.previousMinutes.title} — ${prevDate}`, {
      x: MARGIN, y, size: 10, font: fonts.helvetica, color: COLORS.darkGray,
    })
    y -= 16
  }

  // ============================================================
  // SECTION 2 — RISK REGISTER SUMMARY
  // ============================================================
  sectionPage = await addPage(doc, false)
  const riskPageNum = doc.pdfDoc.getPages().length
  sections.push({ name: 'Risk Register Summary', page: riskPageNum, level: 0 })
  y = CONTENT_TOP
  y = drawSectionHeader(sectionPage, fonts, y, '2. Risk Register Summary')

  sectionPage.drawText('Top 20 Risks by Inherent Score (Heatmap Coded)', {
    x: MARGIN, y, size: 11, font: fonts.helveticaOblique, color: COLORS.mediumGray,
  })
  y -= 24

  if (data?.risks?.length > 0) {
    const topRisks = data.risks.slice(0, 20)
    // Estimate if table fits; if too many, cap at ~25 rows per page
    const maxRows = Math.min(topRisks.length, 25)
    y = drawTable(sectionPage, y, [
      { key: 'risk_id', label: 'ID' }, { key: 'title', label: 'Risk' },
      { key: 'category', label: 'Category' }, { key: 'inherent_score', label: 'Inh.' },
      { key: 'residual_score', label: 'Res.' }, { key: 'treatment_status', label: 'Status' },
      { key: 'owner_name', label: 'Owner' },
    ], topRisks, fonts, {
      statusKey: 'inherent_score', statusColorFn: scoreHeatmapColor,
      fontSize: 8, rowHeight: 20, maxRows,
    })

    // If more rows remain, add another page
    if (topRisks.length > maxRows) {
      sectionPage = await addPage(doc, false)
      y = CONTENT_TOP
      y = drawTable(sectionPage, y, [
        { key: 'risk_id', label: 'ID' }, { key: 'title', label: 'Risk' },
        { key: 'category', label: 'Category' }, { key: 'inherent_score', label: 'Inh.' },
        { key: 'residual_score', label: 'Res.' }, { key: 'treatment_status', label: 'Status' },
        { key: 'owner_name', label: 'Owner' },
      ], topRisks.slice(maxRows), fonts, {
        statusKey: 'inherent_score', statusColorFn: scoreHeatmapColor,
        fontSize: 8, rowHeight: 20,
      })
    }
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No risk register entries available for this institution.')
  }

  // ============================================================
  // SECTION 3 — COMPLIANCE OBLIGATIONS STATUS
  // ============================================================
  sectionPage = await addPage(doc, false)
  const compliancePageNum = doc.pdfDoc.getPages().length
  sections.push({ name: 'Compliance Obligations Status', page: compliancePageNum, level: 0 })
  y = CONTENT_TOP
  y = drawSectionHeader(sectionPage, fonts, y, '3. Compliance Obligations Status')

  const cStats = data?.compliance?.stats || {}
  const compCards = [
    { label: 'Total', value: String(cStats.total || 0), color: COLORS.navy },
    { label: 'Compliant', value: String(cStats.compliant || 0), color: COLORS.green },
    { label: 'Non-Compliant', value: String(cStats.nonCompliant || 0), color: COLORS.red },
    { label: 'Due Soon', value: String(cStats.dueSoon || 0), color: COLORS.orange },
  ]
  y = drawStatCards(sectionPage, fonts, y, compCards)
  y -= 24

  // Regulation breakdown
  if (data?.compliance?.byRegulation?.length > 0) {
    const result = checkPageBreak(doc, sectionPage, y, 160)
    sectionPage = result.page; y = result.y

    sectionPage.drawText('Obligations by Regulation', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 24
    y = drawTable(sectionPage, y, [
      { key: 'regulation', label: 'Regulation' }, { key: 'total', label: 'Total' },
      { key: 'compliant', label: 'Compliant' }, { key: 'nonCompliant', label: 'Non-Compliant' },
      { key: 'dueSoon', label: 'Due Soon' },
    ], data.compliance.byRegulation, fonts, { fontSize: 9, rowHeight: 20 })
    y -= 20
  }

  // Non-compliant items
  if (data?.compliance?.nonCompliantItems?.length > 0) {
    const result = checkPageBreak(doc, sectionPage, y, 220)
    sectionPage = result.page; y = result.y

    sectionPage.drawText('Non-Compliant Items Requiring Board Attention', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.red,
    })
    y -= 24
    y = drawTable(sectionPage, y, [
      { key: 'regulation', label: 'Regulation' }, { key: 'obligation', label: 'Obligation' },
      { key: 'due_date', label: 'Due' }, { key: 'owner_name', label: 'Owner' },
    ], data.compliance.nonCompliantItems.slice(0, 15), fonts, {
      fontSize: 8, rowHeight: 20,
    })
  }

  // ============================================================
  // SECTION 4 — BOARD ACTION TRACKER
  // ============================================================
  sectionPage = await addPage(doc, false)
  const actionsPageNum = doc.pdfDoc.getPages().length
  sections.push({ name: 'Board Action Tracker', page: actionsPageNum, level: 0 })
  y = CONTENT_TOP
  y = drawSectionHeader(sectionPage, fonts, y, '4. Board Action Tracker')

  const aStats = data?.actions?.stats || {}
  const actionCards = [
    { label: 'Pending', value: String(aStats.pending || 0), color: COLORS.orange },
    { label: 'In Progress', value: String(aStats.inProgress || 0), color: COLORS.navy },
    { label: 'Overdue', value: String(aStats.overdue || 0), color: COLORS.red },
    { label: 'Completed', value: String(aStats.completed || 0), color: COLORS.green },
  ]
  y = drawStatCards(sectionPage, fonts, y, actionCards)
  y -= 24

  if (data?.actions?.actions?.length > 0) {
    const pendingOverdue = data.actions.actions.filter((a: any) => ['Pending', 'Overdue'].includes(a.status))
    const displayActions = pendingOverdue.length > 0 ? pendingOverdue : data.actions.actions

    const result = checkPageBreak(doc, sectionPage, y, 220)
    sectionPage = result.page; y = result.y

    sectionPage.drawText('Pending & Overdue Actions', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 24
    y = drawTable(sectionPage, y, [
      { key: 'description', label: 'Action' }, { key: 'meeting_title', label: 'Meeting' },
      { key: 'assigned_to_name', label: 'Assignee' }, { key: 'due_date', label: 'Due' },
      { key: 'status', label: 'Status' },
    ], displayActions.slice(0, 20), fonts, {
      statusKey: 'status', statusColorFn: getStatusColor,
      fontSize: 8, rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No board actions on record.')
  }

  // ============================================================
  // SECTION 5 — AUDIT FINDINGS REGISTER
  // ============================================================
  sectionPage = await addPage(doc, false)
  const auditPageNum = doc.pdfDoc.getPages().length
  sections.push({ name: 'Audit Findings Register', page: auditPageNum, level: 0 })
  y = CONTENT_TOP
  y = drawSectionHeader(sectionPage, fonts, y, '5. Audit Findings Register')

  if (data?.findings?.length > 0) {
    sectionPage.drawText(`Open Findings: ${data.findings.length}`, {
      x: MARGIN, y, size: 11, font: fonts.helveticaOblique, color: COLORS.mediumGray,
    })
    y -= 22

    y = drawTable(sectionPage, y, [
      { key: 'title', label: 'Finding' }, { key: 'severity', label: 'Severity' },
      { key: 'status', label: 'Status' }, { key: 'due_date', label: 'Due' },
      { key: 'owner_name', label: 'Owner' },
    ], data.findings.slice(0, 20), fonts, {
      statusKey: 'severity', statusColorFn: getStatusColor,
      fontSize: 8, rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No open audit findings.')
  }

  // ============================================================
  // SECTION 6 — INCIDENT SUMMARY
  // ============================================================
  sectionPage = await addPage(doc, false)
  const incidentPageNum = doc.pdfDoc.getPages().length
  sections.push({ name: 'Incident Summary', page: incidentPageNum, level: 0 })
  y = CONTENT_TOP
  y = drawSectionHeader(sectionPage, fonts, y, '6. Incident Summary')

  if (data?.incidents?.length > 0) {
    sectionPage.drawText(`Open Incidents: ${data.incidents.length}`, {
      x: MARGIN, y, size: 11, font: fonts.helveticaOblique, color: COLORS.mediumGray,
    })
    y -= 22

    y = drawTable(sectionPage, y, [
      { key: 'title', label: 'Incident' }, { key: 'severity', label: 'Severity' },
      { key: 'status', label: 'Status' }, { key: 'incident_date', label: 'Date' },
    ], data.incidents.slice(0, 20), fonts, {
      statusKey: 'status', statusColorFn: getStatusColor,
      fontSize: 8, rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No open incidents reported.')
  }

  // ============================================================
  // SECTION 7 — STRATEGIC OBJECTIVES & KPI PERFORMANCE
  // ============================================================
  sectionPage = await addPage(doc, false)
  const strategicPageNum = doc.pdfDoc.getPages().length
  sections.push({ name: 'Strategic Objectives / KPI Performance', page: strategicPageNum, level: 0 })
  y = CONTENT_TOP
  y = drawSectionHeader(sectionPage, fonts, y, '7. Strategic Objectives & KPI Performance')

  if (data?.objectives?.length > 0) {
    const result = checkPageBreak(doc, sectionPage, y, 200)
    sectionPage = result.page; y = result.y

    sectionPage.drawText('Strategic Objectives', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 22

    y = drawTable(sectionPage, y, [
      { key: 'title', label: 'Objective' }, { key: 'description', label: 'Description' },
      { key: 'status', label: 'Status' }, { key: 'progress_percentage', label: 'Progress %' },
    ], data.objectives.slice(0, 15), fonts, {
      statusKey: 'status', statusColorFn: getStatusColor,
      fontSize: 8, rowHeight: 20,
    })
    y -= 20
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No strategic objectives defined.')
    y -= 20
  }

  if (data?.kpis?.length > 0) {
    const result = checkPageBreak(doc, sectionPage, y, 200)
    sectionPage = result.page; y = result.y

    sectionPage.drawText('Key Performance Indicators', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 22

    const kpiRows = data.kpis.map((k: any) => ({
      ...k,
      variance: `${((k.actual_value || 0) - (k.target_value || 0)).toFixed(1)} ${k.unit || ''}`,
      attainment: `${k.target_value ? Math.round((k.actual_value / k.target_value) * 100) : 0}%`,
    }))

    y = drawTable(sectionPage, y, [
      { key: 'name', label: 'KPI' }, { key: 'actual_value', label: 'Actual' },
      { key: 'target_value', label: 'Target' }, { key: 'attainment', label: 'Attainment' },
      { key: 'variance', label: 'Variance' }, { key: 'status', label: 'Status' },
    ], kpiRows.slice(0, 15), fonts, {
      statusKey: 'status', statusColorFn: getStatusColor,
      fontSize: 8, rowHeight: 20,
    })
  } else {
    const result = checkPageBreak(doc, sectionPage, y, 40)
    sectionPage = result.page; y = result.y
    y = drawEmptyState(sectionPage, fonts, y, 'No KPIs configured.')
  }

  // ============================================================
  // SECTION 8 — FINANCIAL CONTROLS / BUDGET VARIANCE
  // ============================================================
  sectionPage = await addPage(doc, false)
  const financialPageNum = doc.pdfDoc.getPages().length
  sections.push({ name: 'Financial Controls / Budget Variance', page: financialPageNum, level: 0 })
  y = CONTENT_TOP
  y = drawSectionHeader(sectionPage, fonts, y, '8. Financial Controls & Budget Variance')

  sectionPage.drawText('Placeholder — Financial data to be integrated from ERP/IFMIS.', {
    x: MARGIN, y, size: 10, font: fonts.helveticaOblique, color: COLORS.mediumGray,
  })
  y -= 28

  const placeholderFinancials = [
    { line: 'Personnel Expenditure', budget: 'ZWL 45,000,000', actual: 'ZWL 42,300,000', variance: 'ZWL 2,700,000', percent: '6.0%' },
    { line: 'Operations & Maintenance', budget: 'ZWL 18,000,000', actual: 'ZWL 19,200,000', variance: 'ZWL (1,200,000)', percent: '(6.7%)' },
    { line: 'Capital Expenditure', budget: 'ZWL 30,000,000', actual: 'ZWL 12,500,000', variance: 'ZWL 17,500,000', percent: '58.3%' },
    { line: 'Compliance & Audit', budget: 'ZWL 5,000,000', actual: 'ZWL 4,800,000', variance: 'ZWL 200,000', percent: '4.0%' },
  ]
  y = drawTable(sectionPage, y, [
    { key: 'line', label: 'Budget Line' }, { key: 'budget', label: 'Budget' },
    { key: 'actual', label: 'Actual' }, { key: 'variance', label: 'Variance' },
    { key: 'percent', label: '%' },
  ], placeholderFinancials, fonts, { fontSize: 9, rowHeight: 22 })
  y -= 20

  sectionPage.drawText('Notes: Variance > 10% requires board ratification per PFMA Circular No. 1 of 2024.', {
    x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
  })

  // ============================================================
  // SECTION 9 — APPENDIX
  // ============================================================
  sectionPage = await addPage(doc, false)
  const appendixPageNum = doc.pdfDoc.getPages().length
  sections.push({ name: 'Appendix', page: appendixPageNum, level: 0 })
  y = CONTENT_TOP
  y = drawSectionHeader(sectionPage, fonts, y, '9. Appendix')

  // Policy Acknowledgments
  const result = checkPageBreak(doc, sectionPage, y, 120)
  sectionPage = result.page; y = result.y
  sectionPage.drawText('A. Policy Acknowledgments', {
    x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 18
  sectionPage.drawText('Board members are reminded to acknowledge the Code of Conduct, Conflict of Interest, and Whistleblower policies.', {
    x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 14
  const policyAcks = [
    { policy: 'Code of Conduct & Ethics', acknowledged: '—', pending: '—' },
    { policy: 'Conflict of Interest Declaration', acknowledged: '—', pending: '—' },
    { policy: 'Information Security Policy', acknowledged: '—', pending: '—' },
    { policy: 'Whistleblower Protection', acknowledged: '—', pending: '—' },
  ]
  y = drawTable(sectionPage, y, [
    { key: 'policy', label: 'Policy' }, { key: 'acknowledged', label: 'Acknowledged' }, { key: 'pending', label: 'Pending' },
  ], policyAcks, fonts, { fontSize: 9, rowHeight: 20 })
  y -= 20

  // Vendor Risk
  const result2 = checkPageBreak(doc, sectionPage, y, 120)
  sectionPage = result2.page; y = result2.y
  sectionPage.drawText('B. Vendor Risk Overview', {
    x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 18
  sectionPage.drawText('High-risk vendors requiring board oversight:', {
    x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 14
  const vendorRows = [
    { vendor: 'Vendor data not available', risk: 'N/A', status: 'Pending Integration' },
  ]
  y = drawTable(sectionPage, y, [
    { key: 'vendor', label: 'Vendor' }, { key: 'risk', label: 'Risk Rating' }, { key: 'status', label: 'Status' },
  ], vendorRows, fonts, { fontSize: 9, rowHeight: 20 })
  y -= 20

  // Whistleblower Stats
  const result3 = checkPageBreak(doc, sectionPage, y, 120)
  sectionPage = result3.page; y = result3.y
  sectionPage.drawText('C. Whistleblower Statistics', {
    x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 18
  sectionPage.drawText('Anonymised reporting data for the reporting period:', {
    x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 14
  const whistleRows = [
    { metric: 'Reports Received', value: '—' },
    { metric: 'Under Investigation', value: '—' },
    { metric: 'Closed / Substantiated', value: '—' },
    { metric: 'Closed / Unsubstantiated', value: '—' },
  ]
  y = drawTable(sectionPage, y, [
    { key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' },
  ], whistleRows, fonts, { fontSize: 9, rowHeight: 20 })

  // ============================================================
  // DRAW TABLE OF CONTENTS (on reserved page 2)
  // ============================================================
  let tocY = CONTENT_TOP
  tocPage.drawText('TABLE OF CONTENTS', {
    x: MARGIN, y: tocY, size: 20, font: fonts.helveticaBold, color: COLORS.navy,
  })
  tocY -= 28
  tocPage.drawLine({
    start: { x: MARGIN, y: tocY }, end: { x: MARGIN + CONTENT_WIDTH, y: tocY },
    thickness: 1.5, color: COLORS.gold,
  })
  tocY -= 28

  for (const section of sections) {
    tocY = drawTocItem(tocPage, fonts, tocY, section.name, section.page, section.level || 0)
  }

  // Add closing notice
  tocY -= 20
  tocPage.drawText('This document is classified. Distribution is restricted to board members and designated officials.', {
    x: MARGIN, y: tocY, size: 8, font: fonts.helvetica, color: COLORS.mediumGray,
  })

  return finalizeDocument(doc)
}
