import { COLORS, getStatusColor } from '../engine/branding'
import { createBrandedDocument, addPage, finalizeDocument, CONTENT_TOP, MARGIN, CONTENT_WIDTH, FOOTER_HEIGHT } from '../engine/layout'
import { drawTable } from '../engine/tables'

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
  const cardWidth = CONTENT_WIDTH / 4 - 10
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
    if (cardCol === 4) { cardCol = 0; cardRowY -= (cardHeight + 12) }
  })
  return cardRowY - (cardCol > 0 ? cardHeight + 12 : 0)
}

export async function buildAnnualCorporateGovernanceReturnPdf(data: any, metadata: any = {}) {
  const doc = await createBrandedDocument({
    reportTitle: 'Annual Corporate Governance Return',
    reportId: 'RPT-020',
    classification: data?.classification || 'OFFICIAL — REGULATORY SUBMISSION',
    ...metadata,
  })

  const { fonts } = doc

  // ============================================================
  // PAGE 1 — COVER
  // ============================================================
  const coverPage = await addPage(doc, true)
  let y = CONTENT_TOP + 40

  coverPage.drawRectangle({
    x: 0, y: 841.89 - 8, width: 595.28, height: 8, color: COLORS.gold,
  })

  coverPage.drawText(metadata.institution || 'Republic of Zimbabwe', {
    x: MARGIN, y, size: 11, font: fonts.helvetica, color: COLORS.mediumGray,
  })
  y -= 36

  coverPage.drawText('ANNUAL CORPORATE GOVERNANCE RETURN', {
    x: MARGIN, y, size: 24, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 36

  const year = data?.year || new Date().getFullYear()
  coverPage.drawText(`Reporting Year: ${year}`, {
    x: MARGIN, y, size: 16, font: fonts.helveticaBold, color: COLORS.darkGray,
  })
  y -= 28

  const submittedDate = data?.submittedDate
    ? new Date(data.submittedDate).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  coverPage.drawText(`Date Submitted: ${submittedDate}`, {
    x: MARGIN, y, size: 12, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 22

  if (data?.registrationNumber) {
    coverPage.drawText(`Registration Number: ${data.registrationNumber}`, {
      x: MARGIN, y, size: 12, font: fonts.helvetica, color: COLORS.darkGray,
    })
    y -= 22
  }

  coverPage.drawText(`Classification: ${doc.metadata.classification}`, {
    x: MARGIN, y, size: 10, font: fonts.helveticaBold, color: COLORS.red,
  })
  y -= 40

  coverPage.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 1.5, color: COLORS.gold,
  })
  y -= 32

  coverPage.drawText('This document is submitted in terms of the Public Entities Corporate Governance Act and related regulations.', {
    x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 28
  coverPage.drawText('It constitutes a formal statutory return to the regulator (ZIMRA / PECOGA / Ministry of Finance).', {
    x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 28
  coverPage.drawText('All representations herein are made to the best knowledge and belief of the Board and Management.', {
    x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
  })

  // ============================================================
  // SECTION 2 — GOVERNANCE STRUCTURE
  // ============================================================
  let sectionPage = await addPage(doc, false)
  y = CONTENT_TOP
  y = drawSectionHeader(sectionPage, fonts, y, '1. Governance Structure')

  if (data?.boardMembers?.length > 0) {
    const independenceCount = data.boardMembers.filter((m: any) => m.isIndependent).length
    const totalCount = data.boardMembers.length
    const ratio = totalCount > 0 ? `${Math.round((independenceCount / totalCount) * 100)}%` : '0%'

    sectionPage.drawText(`Board Independence Ratio: ${independenceCount} of ${totalCount} (${ratio})`, {
      x: MARGIN, y, size: 11, font: fonts.helveticaOblique, color: COLORS.mediumGray,
    })
    y -= 24

    y = drawTable(sectionPage, y, [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'isIndependent', label: 'Independent' },
      { key: 'appointmentDate', label: 'Appointed' },
      { key: 'tenureYears', label: 'Tenure (Yrs)' },
    ], data.boardMembers, fonts, {
      statusKey: 'isIndependent',
      statusColorFn: (s: any) => s === 'Yes' || s === true ? COLORS.green : COLORS.orange,
      fontSize: 8,
      rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No board member records available.')
  }
  y -= 20

  // ============================================================
  // SECTION 3 — BOARD MEETINGS
  // ============================================================
  const result = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result.page; y = result.y
  y = drawSectionHeader(sectionPage, fonts, y, '2. Board Meetings')

  if (data?.boardMeetings?.length > 0) {
    const attendanceRate = data.boardMeetings.length > 0
      ? Math.round(data.boardMeetings.reduce((sum: number, m: any) => sum + (m.attendanceRate || 0), 0) / data.boardMeetings.length)
      : 0
    const quorumCompliant = data.boardMeetings.filter((m: any) => m.quorumMet).length

    sectionPage.drawText(`Annual Attendance Rate: ${attendanceRate}% | Quorum Compliant Meetings: ${quorumCompliant} of ${data.boardMeetings.length}`, {
      x: MARGIN, y, size: 11, font: fonts.helveticaOblique, color: COLORS.mediumGray,
    })
    y -= 24

    y = drawTable(sectionPage, y, [
      { key: 'meeting_date', label: 'Date' },
      { key: 'title', label: 'Meeting' },
      { key: 'attendanceRate', label: 'Attendance %' },
      { key: 'quorumMet', label: 'Quorum Met' },
      { key: 'minutesStatus', label: 'Minutes' },
    ], data.boardMeetings, fonts, {
      statusKey: 'quorumMet',
      statusColorFn: (s: any) => s === 'Yes' || s === true ? COLORS.green : COLORS.red,
      fontSize: 8,
      rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No board meeting records for the reporting year.')
  }
  y -= 20

  // ============================================================
  // SECTION 4 — COMMITTEE STRUCTURE
  // ============================================================
  const result2 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result2.page; y = result2.y
  y = drawSectionHeader(sectionPage, fonts, y, '3. Committee Structure')

  if (data?.committees?.length > 0) {
    y = drawTable(sectionPage, y, [
      { key: 'name', label: 'Committee' },
      { key: 'chair', label: 'Chair' },
      { key: 'members', label: 'Members' },
      { key: 'meetingsHeld', label: 'Meetings' },
      { key: 'status', label: 'Status' },
    ], data.committees, fonts, {
      statusKey: 'status',
      statusColorFn: getStatusColor,
      fontSize: 8,
      rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No committee structure records available.')
  }
  y -= 20

  // ============================================================
  // SECTION 5 — RISK MANAGEMENT
  // ============================================================
  const result3 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result3.page; y = result3.y
  y = drawSectionHeader(sectionPage, fonts, y, '4. Risk Management')

  sectionPage.drawText('Risk Framework Summary', {
    x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 20
  sectionPage.drawText(data?.riskFrameworkSummary || 'The institution maintains a comprehensive Enterprise Risk Management (ERM) framework aligned with ISO 31000 and King IV principles.', {
    x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 28

  if (data?.riskAppetiteStatement) {
    sectionPage.drawText('Risk Appetite Statement', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 20
    sectionPage.drawText(data.riskAppetiteStatement, {
      x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
    })
    y -= 28
  }

  const riskStats = data?.riskStats || {}
  const riskCards = [
    { label: 'Total Risks', value: String(riskStats.total || 0), color: COLORS.navy },
    { label: 'Register Coverage %', value: `${riskStats.coverage || 0}%`, color: (riskStats.coverage || 0) < 80 ? COLORS.red : COLORS.green },
    { label: 'Critical Risks', value: String(riskStats.critical || 0), color: (riskStats.critical || 0) > 0 ? COLORS.red : COLORS.green },
    { label: 'High Risks', value: String(riskStats.high || 0), color: (riskStats.high || 0) > 0 ? COLORS.orange : COLORS.green },
  ]
  y = drawStatCards(sectionPage, fonts, y, riskCards)
  y -= 24

  if (data?.topRisks?.length > 0) {
    const resultR = checkPageBreak(doc, sectionPage, y, 200)
    sectionPage = resultR.page; y = resultR.y

    sectionPage.drawText('Top 10 Risks', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 24
    y = drawTable(sectionPage, y, [
      { key: 'risk_id', label: 'ID' },
      { key: 'title', label: 'Risk' },
      { key: 'category', label: 'Category' },
      { key: 'inherent_score', label: 'Score' },
      { key: 'treatment_status', label: 'Status' },
    ], data.topRisks.slice(0, 10), fonts, {
      statusKey: 'treatment_status',
      statusColorFn: getStatusColor,
      fontSize: 8,
      rowHeight: 20,
    })
  }
  y -= 20

  // ============================================================
  // SECTION 6 — COMPLIANCE STATUS
  // ============================================================
  const result4 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result4.page; y = result4.y
  y = drawSectionHeader(sectionPage, fonts, y, '5. Compliance Status')

  const compStats = data?.complianceStats || {}
  const compCards = [
    { label: 'Total Regulations', value: String(compStats.total || 0), color: COLORS.navy },
    { label: 'Compliant', value: String(compStats.compliant || 0), color: COLORS.green },
    { label: 'Non-Compliant', value: String(compStats.nonCompliant || 0), color: COLORS.red },
    { label: 'Compliance %', value: `${compStats.percent || 0}%`, color: (compStats.percent || 0) < 80 ? COLORS.red : COLORS.green },
  ]
  y = drawStatCards(sectionPage, fonts, y, compCards)
  y -= 24

  if (data?.complianceByRegulation?.length > 0) {
    const resultC = checkPageBreak(doc, sectionPage, y, 200)
    sectionPage = resultC.page; y = resultC.y

    sectionPage.drawText('Regulation-by-Regulation Compliance', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 24
    y = drawTable(sectionPage, y, [
      { key: 'regulation', label: 'Regulation' },
      { key: 'total', label: 'Total' },
      { key: 'compliant', label: 'Compliant' },
      { key: 'nonCompliant', label: 'Non-Compliant' },
      { key: 'percent', label: '%' },
    ], data.complianceByRegulation, fonts, {
      statusKey: 'percent',
      statusColorFn: (p: string) => {
        const num = parseInt(p, 10)
        if (num < 60) return COLORS.red
        if (num < 80) return COLORS.orange
        return COLORS.green
      },
      fontSize: 8,
      rowHeight: 20,
    })
  }
  y -= 20

  if (data?.nonCompliantItems?.length > 0) {
    const resultNC = checkPageBreak(doc, sectionPage, y, 200)
    sectionPage = resultNC.page; y = resultNC.y

    sectionPage.drawText('Non-Compliant Items with Remediation Plans', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.red,
    })
    y -= 24
    y = drawTable(sectionPage, y, [
      { key: 'regulation', label: 'Regulation' },
      { key: 'obligation', label: 'Obligation' },
      { key: 'remediation', label: 'Remediation Plan' },
      { key: 'due_date', label: 'Due Date' },
    ], data.nonCompliantItems.slice(0, 15), fonts, { fontSize: 8, rowHeight: 20 })
  }
  y -= 20

  // ============================================================
  // SECTION 7 — INTERNAL AUDIT
  // ============================================================
  const result5 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result5.page; y = result5.y
  y = drawSectionHeader(sectionPage, fonts, y, '6. Internal Audit')

  const auditStats = data?.auditStats || {}
  const auditCards = [
    { label: 'Plan Coverage %', value: `${auditStats.planCoverage || 0}%`, color: (auditStats.planCoverage || 0) < 80 ? COLORS.red : COLORS.green },
    { label: 'Open Findings', value: String(auditStats.openFindings || 0), color: (auditStats.openFindings || 0) > 0 ? COLORS.orange : COLORS.green },
    { label: 'Closed Findings', value: String(auditStats.closedFindings || 0), color: COLORS.green },
    { label: 'Mgmt Response Rate', value: `${auditStats.responseRate || 0}%`, color: (auditStats.responseRate || 0) < 80 ? COLORS.red : COLORS.green },
  ]
  y = drawStatCards(sectionPage, fonts, y, auditCards)
  y -= 24

  if (data?.auditFindings?.length > 0) {
    const resultA = checkPageBreak(doc, sectionPage, y, 200)
    sectionPage = resultA.page; y = resultA.y

    sectionPage.drawText('Findings by Severity', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 24
    y = drawTable(sectionPage, y, [
      { key: 'title', label: 'Finding' },
      { key: 'severity', label: 'Severity' },
      { key: 'status', label: 'Status' },
      { key: 'remediationStatus', label: 'Remediation' },
      { key: 'due_date', label: 'Due' },
    ], data.auditFindings.slice(0, 15), fonts, {
      statusKey: 'severity',
      statusColorFn: getStatusColor,
      fontSize: 8,
      rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No audit findings recorded for the reporting year.')
  }
  y -= 20

  // ============================================================
  // SECTION 8 — INCIDENT & WHISTLEBLOWER
  // ============================================================
  const result6 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result6.page; y = result6.y
  y = drawSectionHeader(sectionPage, fonts, y, '7. Incident & Whistleblower Reporting')

  const incidentStats = data?.incidentStats || {}
  const incCards = [
    { label: 'Total Incidents', value: String(incidentStats.total || 0), color: COLORS.navy },
    { label: 'Fraud', value: String(incidentStats.fraud || 0), color: (incidentStats.fraud || 0) > 0 ? COLORS.red : COLORS.green },
    { label: 'Cyber', value: String(incidentStats.cyber || 0), color: (incidentStats.cyber || 0) > 0 ? COLORS.orange : COLORS.green },
    { label: 'Governance', value: String(incidentStats.governance || 0), color: (incidentStats.governance || 0) > 0 ? COLORS.orange : COLORS.green },
  ]
  y = drawStatCards(sectionPage, fonts, y, incCards)
  y -= 24

  if (data?.incidentsByCategory?.length > 0) {
    const resultI = checkPageBreak(doc, sectionPage, y, 160)
    sectionPage = resultI.page; y = resultI.y

    sectionPage.drawText('Incident Count by Category', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 24
    y = drawTable(sectionPage, y, [
      { key: 'category', label: 'Category' },
      { key: 'count', label: 'Count' },
      { key: 'severity', label: 'Highest Severity' },
    ], data.incidentsByCategory, fonts, {
      statusKey: 'severity',
      statusColorFn: getStatusColor,
      fontSize: 8,
      rowHeight: 20,
    })
  }
  y -= 20

  const wbStats = data?.whistleblowerStats || {}
  const wbCards = [
    { label: 'Reports Received', value: String(wbStats.received || 0), color: COLORS.navy },
    { label: 'Investigated', value: String(wbStats.investigated || 0), color: COLORS.orange },
    { label: 'Substantiated', value: String(wbStats.substantiated || 0), color: COLORS.green },
    { label: 'Unsubstantiated', value: String(wbStats.unsubstantiated || 0), color: COLORS.mediumGray },
  ]
  y = drawStatCards(sectionPage, fonts, y, wbCards)
  y -= 20

  // ============================================================
  // SECTION 9 — STRATEGIC OBJECTIVES
  // ============================================================
  const result7 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result7.page; y = result7.y
  y = drawSectionHeader(sectionPage, fonts, y, '8. Strategic Objectives')

  const stratStats = data?.strategicStats || {}
  const stratCards = [
    { label: 'Plan Progress', value: `${stratStats.progress || 0}%`, color: (stratStats.progress || 0) < 50 ? COLORS.red : COLORS.green },
    { label: 'KPI Attainment', value: `${stratStats.kpiAttainment || 0}%`, color: (stratStats.kpiAttainment || 0) < 60 ? COLORS.red : COLORS.green },
    { label: 'Achievements', value: String(stratStats.achievements || 0), color: COLORS.green },
    { label: 'Missed Targets', value: String(stratStats.missed || 0), color: (stratStats.missed || 0) > 0 ? COLORS.red : COLORS.green },
  ]
  y = drawStatCards(sectionPage, fonts, y, stratCards)
  y -= 24

  if (data?.strategicObjectives?.length > 0) {
    const resultS = checkPageBreak(doc, sectionPage, y, 200)
    sectionPage = resultS.page; y = resultS.y

    sectionPage.drawText('Annual Strategic Plan Progress', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 24
    y = drawTable(sectionPage, y, [
      { key: 'title', label: 'Objective' },
      { key: 'status', label: 'Status' },
      { key: 'progress_percentage', label: 'Progress %' },
      { key: 'achievement', label: 'Achievement' },
    ], data.strategicObjectives, fonts, {
      statusKey: 'status',
      statusColorFn: getStatusColor,
      fontSize: 8,
      rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No strategic objectives data available.')
  }
  y -= 20

  // ============================================================
  // SECTION 10 — FINANCIAL CONTROLS
  // ============================================================
  const result8 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result8.page; y = result8.y
  y = drawSectionHeader(sectionPage, fonts, y, '9. Financial Controls')

  const finStats = data?.financialStats || {}
  const finCards = [
    { label: 'Budget Variance', value: finStats.budgetVariance || '0%', color: finStats.budgetVariance?.startsWith('-') ? COLORS.red : COLORS.green },
    { label: 'Audit Opinion', value: finStats.auditOpinion || 'Unqualified', color: finStats.auditOpinion === 'Unqualified' ? COLORS.green : COLORS.red },
    { label: 'Control Effectiveness', value: finStats.controlRating || '—', color: (finStats.controlRating || '') === 'Effective' ? COLORS.green : COLORS.orange },
  ]
  y = drawStatCards(sectionPage, fonts, y, finCards)
  y -= 24

  if (data?.budgetLines?.length > 0) {
    const resultF = checkPageBreak(doc, sectionPage, y, 200)
    sectionPage = resultF.page; y = resultF.y

    sectionPage.drawText('Budget Variance by Line', {
      x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 24
    y = drawTable(sectionPage, y, [
      { key: 'line', label: 'Budget Line' },
      { key: 'budget', label: 'Budget' },
      { key: 'actual', label: 'Actual' },
      { key: 'variance', label: 'Variance' },
      { key: 'percent', label: '%' },
    ], data.budgetLines, fonts, { fontSize: 8, rowHeight: 20 })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No financial control data available for this return.')
  }
  y -= 20

  sectionPage.drawText('Notes: Variance > 10% requires board ratification per PFMA Circular No. 1 of 2024.', {
    x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 28

  // ============================================================
  // SECTION 11 — DECLARATION
  // ============================================================
  const result9 = checkPageBreak(doc, sectionPage, y, 320)
  sectionPage = result9.page; y = result9.y
  y = drawSectionHeader(sectionPage, fonts, y, '10. Declaration')

  sectionPage.drawText('CERTIFICATION', {
    x: MARGIN, y, size: 14, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 24

  sectionPage.drawText('We, the undersigned, hereby certify that:', {
    x: MARGIN, y, size: 10, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 18

  const certText = [
    '1. The information contained in this Annual Corporate Governance Return is true and accurate to the best of our knowledge.',
    '2. The institution has complied with all applicable corporate governance requirements during the reporting year.',
    '3. All material risks, incidents, and compliance matters have been disclosed in accordance with regulatory requirements.',
    '4. The Board has exercised its fiduciary duties with due care, skill, and diligence.',
  ]
  certText.forEach(line => {
    sectionPage.drawText(line, {
      x: MARGIN, y, size: 9, font: fonts.helvetica, color: COLORS.darkGray,
    })
    y -= 16
  })
  y -= 20

  // Sign-off blocks
  sectionPage.drawText('Compliance Officer Sign-off', {
    x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 20
  sectionPage.drawText(`Name: ${data?.complianceOfficer?.name || '___________________________'}`, {
    x: MARGIN, y, size: 10, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 18
  sectionPage.drawText(`Signature: ___________________________   Date: ${submittedDate}`, {
    x: MARGIN, y, size: 10, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 32

  sectionPage.drawText('Board Chair Sign-off', {
    x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 20
  sectionPage.drawText(`Name: ${data?.boardChair?.name || '___________________________'}`, {
    x: MARGIN, y, size: 10, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 18
  sectionPage.drawText(`Signature: ___________________________   Date: ${submittedDate}`, {
    x: MARGIN, y, size: 10, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 28

  sectionPage.drawText('This document is submitted in terms of the Public Entities Corporate Governance Act.', {
    x: MARGIN, y, size: 8, font: fonts.helveticaOblique, color: COLORS.mediumGray,
  })

  return finalizeDocument(doc)
}
