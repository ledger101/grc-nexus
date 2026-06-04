import { COLORS, getStatusColor } from '../engine/branding'
import { createBrandedDocument, addPage, finalizeDocument, CONTENT_TOP, MARGIN, CONTENT_WIDTH, FOOTER_HEIGHT } from '../engine/layout'
import { drawTable } from '../engine/tables'

function scoreHeatmapColor(score: number) {
  if (score >= 15) return COLORS.red
  if (score >= 10) return COLORS.orange
  if (score >= 5) return COLORS.gold
  return COLORS.green
}

function bucketLabel(score: number) {
  if (score >= 15) return 'Critical'
  if (score >= 10) return 'High'
  if (score >= 5) return 'Medium'
  return 'Low'
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

function trendArrow(trend: string) {
  if (trend === 'increasing') return '↑'
  if (trend === 'declining') return '↓'
  return '→'
}

function trendColor(trend: string) {
  if (trend === 'increasing') return COLORS.red
  if (trend === 'declining') return COLORS.green
  return COLORS.orange
}

export async function buildQuarterlyRiskCommitteePackPdf(data: any, metadata: any = {}) {
  const doc = await createBrandedDocument({
    reportTitle: 'Quarterly Board Risk Committee Pack',
    reportId: 'RPT-015',
    classification: data?.classification || 'CONFIDENTIAL — BOARD USE ONLY',
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

  coverPage.drawText('QUARTERLY BOARD RISK COMMITTEE PACK', {
    x: MARGIN, y, size: 26, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 40

  const quarter = data?.quarter || 'Q2'
  const year = data?.year || new Date().getFullYear()
  coverPage.drawText(`${quarter} ${year}`, {
    x: MARGIN, y, size: 18, font: fonts.helveticaBold, color: COLORS.darkGray,
  })
  y -= 28

  const meetingDate = data?.meetingDate
    ? new Date(data.meetingDate).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  coverPage.drawText(`Date: ${meetingDate}`, {
    x: MARGIN, y, size: 12, font: fonts.helvetica, color: COLORS.darkGray,
  })
  y -= 22

  coverPage.drawText(`Classification: ${doc.metadata.classification}`, {
    x: MARGIN, y, size: 10, font: fonts.helveticaBold, color: COLORS.red,
  })
  y -= 40

  coverPage.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 1.5, color: COLORS.gold,
  })
  y -= 32

  coverPage.drawText('Prepared by the Governance, Risk & Compliance Office', {
    x: MARGIN, y, size: 9, font: fonts.helveticaOblique, color: COLORS.mediumGray,
  })
  y -= 16
  coverPage.drawText('This document is classified and intended solely for Board Risk Committee members.', {
    x: MARGIN, y, size: 8, font: fonts.helvetica, color: COLORS.mediumGray,
  })

  // ============================================================
  // SECTION 2 — RISK DASHBOARD
  // ============================================================
  let sectionPage = await addPage(doc, false)
  y = CONTENT_TOP
  y = drawSectionHeader(sectionPage, fonts, y, '1. Risk Dashboard')

  const stats = data.stats || {}
  const cards = [
    { label: 'Total Risks', value: String(stats.totalRisks || 0), color: COLORS.navy },
    { label: 'Critical Risks', value: String(stats.criticalRisks || 0), color: (stats.criticalRisks || 0) > 0 ? COLORS.red : COLORS.green },
    { label: 'High Risks', value: String(stats.highRisks || 0), color: (stats.highRisks || 0) > 0 ? COLORS.orange : COLORS.green },
    { label: 'Open Mitigations', value: String(stats.openMitigations || 0), color: (stats.openMitigations || 0) > 5 ? COLORS.orange : COLORS.navy },
  ]
  y = drawStatCards(sectionPage, fonts, y, cards)
  y -= 28

  // ============================================================
  // SECTION 3 — RISK HEATMAP
  // ============================================================
  y = drawSectionHeader(sectionPage, fonts, y, '2. Risk Heatmap')

  const heatmap = data.heatmap || {}
  const heatmapRows = [
    { bucket: 'Critical (≥15)', count: heatmap.critical || 0, percent: `${heatmap.criticalPercent || 0}%`, color: 'Critical' },
    { bucket: 'High (10–14)', count: heatmap.high || 0, percent: `${heatmap.highPercent || 0}%`, color: 'High' },
    { bucket: 'Medium (5–9)', count: heatmap.medium || 0, percent: `${heatmap.mediumPercent || 0}%`, color: 'Medium' },
    { bucket: 'Low (<5)', count: heatmap.low || 0, percent: `${heatmap.lowPercent || 0}%`, color: 'Low' },
  ]

  if (heatmapRows.length > 0) {
    y = drawTable(sectionPage, y, [
      { key: 'bucket', label: 'Score Bucket' },
      { key: 'count', label: 'Count' },
      { key: 'percent', label: '% of Total' },
      { key: 'color', label: 'Rating' },
    ], heatmapRows, fonts, {
      statusKey: 'color',
      statusColorFn: (s: string) => {
        if (s === 'Critical') return COLORS.red
        if (s === 'High') return COLORS.orange
        if (s === 'Medium') return COLORS.gold
        return COLORS.green
      },
      fontSize: 9,
      rowHeight: 22,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No risk heatmap data available.')
  }
  y -= 20

  // ============================================================
  // SECTION 4 — EMERGING RISKS REGISTER
  // ============================================================
  const result = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result.page; y = result.y
  y = drawSectionHeader(sectionPage, fonts, y, '3. Emerging Risks Register')

  if (data?.emergingRisks?.length > 0) {
    const emergingRows = data.emergingRisks.map((r: any) => ({
      ...r,
      trendDisplay: `${trendArrow(r.trend)} ${r.trend || 'stable'}`,
    }))
    y = drawTable(sectionPage, y, [
      { key: 'risk_id', label: 'ID' },
      { key: 'title', label: 'Risk' },
      { key: 'category', label: 'Category' },
      { key: 'inherent_score', label: 'Score' },
      { key: 'trendDisplay', label: 'Trend' },
    ], emergingRows, fonts, {
      statusKey: 'trendDisplay',
      statusColorFn: (s: string) => {
        if (s.includes('increasing')) return COLORS.red
        if (s.includes('declining')) return COLORS.green
        return COLORS.orange
      },
      fontSize: 8,
      rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No emerging risks identified in the last 90 days.')
  }
  y -= 20

  // ============================================================
  // SECTION 5 — KRI TREND ANALYSIS
  // ============================================================
  const result2 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result2.page; y = result2.y
  y = drawSectionHeader(sectionPage, fonts, y, '4. KRI Trend Analysis')

  if (data?.kris?.length > 0) {
    const kriRows = data.kris.map((k: any) => ({
      ...k,
      readingDisplay: `${k.currentReading || '—'} ${k.unit || ''}`,
      thresholdDisplay: `${k.threshold || '—'} ${k.unit || ''}`,
      trendDisplay: trendArrow(k.trend),
    }))
    y = drawTable(sectionPage, y, [
      { key: 'title', label: 'KRI' },
      { key: 'readingDisplay', label: 'Current' },
      { key: 'thresholdDisplay', label: 'Threshold' },
      { key: 'breachStatus', label: 'Breach' },
      { key: 'trendDisplay', label: 'Trend' },
    ], kriRows, fonts, {
      statusKey: 'breachStatus',
      statusColorFn: (s: string) => {
        if (s === 'breached') return COLORS.red
        if (s === 'at_risk') return COLORS.orange
        return COLORS.green
      },
      fontSize: 8,
      rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No KRI readings available for this period.')
  }
  y -= 20

  // ============================================================
  // SECTION 6 — MITIGATION ACTIONS TRACKER
  // ============================================================
  const result3 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result3.page; y = result3.y
  y = drawSectionHeader(sectionPage, fonts, y, '5. Mitigation Actions Tracker')

  if (data?.mitigations?.length > 0) {
    const mitRows = data.mitigations.map((m: any) => ({
      ...m,
      progressDisplay: `${m.progress || 0}%`,
    }))
    y = drawTable(sectionPage, y, [
      { key: 'title', label: 'Action' },
      { key: 'target_date', label: 'Target Date' },
      { key: 'owner_name', label: 'Owner' },
      { key: 'progressDisplay', label: 'Progress' },
      { key: 'status', label: 'Status' },
    ], mitRows, fonts, {
      statusKey: 'status',
      statusColorFn: getStatusColor,
      fontSize: 8,
      rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No open mitigation actions on record.')
  }
  y -= 20

  // ============================================================
  // SECTION 7 — INCIDENT-TO-RISK MAPPING
  // ============================================================
  const result4 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result4.page; y = result4.y
  y = drawSectionHeader(sectionPage, fonts, y, '6. Incident-to-Risk Mapping')

  if (data?.incidentRiskMap?.length > 0) {
    y = drawTable(sectionPage, y, [
      { key: 'incident_title', label: 'Incident' },
      { key: 'incident_date', label: 'Date' },
      { key: 'severity', label: 'Severity' },
      { key: 'linked_risk_title', label: 'Root Cause Risk' },
      { key: 'linked_risk_id', label: 'Risk ID' },
    ], data.incidentRiskMap, fonts, {
      statusKey: 'severity',
      statusColorFn: getStatusColor,
      fontSize: 8,
      rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No incident-to-risk mapping data available.')
  }
  y -= 20

  // ============================================================
  // SECTION 8 — RISK APPETITE VS EXPOSURE
  // ============================================================
  const result5 = checkPageBreak(doc, sectionPage, y, 200)
  sectionPage = result5.page; y = result5.y
  y = drawSectionHeader(sectionPage, fonts, y, '7. Risk Appetite vs Exposure')

  if (data?.riskAppetite?.length > 0) {
    y = drawTable(sectionPage, y, [
      { key: 'category', label: 'Category' },
      { key: 'appetite_limit', label: 'Appetite Limit' },
      { key: 'actual_exposure', label: 'Actual Exposure' },
      { key: 'variance', label: 'Variance' },
      { key: 'status', label: 'Status' },
    ], data.riskAppetite, fonts, {
      statusKey: 'status',
      statusColorFn: (s: string) => {
        if (s === 'Breached') return COLORS.red
        if (s === 'Near Limit') return COLORS.orange
        return COLORS.green
      },
      fontSize: 8,
      rowHeight: 20,
    })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No risk appetite statements configured.')
  }
  y -= 20

  // ============================================================
  // SECTION 9 — FORWARD LOOK
  // ============================================================
  const result6 = checkPageBreak(doc, sectionPage, y, 160)
  sectionPage = result6.page; y = result6.y
  y = drawSectionHeader(sectionPage, fonts, y, '8. Forward Look')

  sectionPage.drawText('Risks to Watch Next Quarter', {
    x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 22

  if (data?.forwardRisks?.length > 0) {
    y = drawTable(sectionPage, y, [
      { key: 'title', label: 'Risk' },
      { key: 'category', label: 'Category' },
      { key: 'reason', label: 'Reason to Watch' },
    ], data.forwardRisks, fonts, { fontSize: 8, rowHeight: 20 })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No forward-looking risks identified.')
  }
  y -= 20

  const result7 = checkPageBreak(doc, sectionPage, y, 140)
  sectionPage = result7.page; y = result7.y

  sectionPage.drawText('Upcoming Regulatory Changes', {
    x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 22

  if (data?.upcomingRegulations?.length > 0) {
    y = drawTable(sectionPage, y, [
      { key: 'regulation', label: 'Regulation' },
      { key: 'effective_date', label: 'Effective Date' },
      { key: 'impact', label: 'Impact' },
    ], data.upcomingRegulations, fonts, { fontSize: 8, rowHeight: 20 })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No upcoming regulatory changes flagged.')
  }
  y -= 20

  const result8 = checkPageBreak(doc, sectionPage, y, 140)
  sectionPage = result8.page; y = result8.y

  sectionPage.drawText('Planned Audits', {
    x: MARGIN, y, size: 12, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 22

  if (data?.plannedAudits?.length > 0) {
    y = drawTable(sectionPage, y, [
      { key: 'title', label: 'Audit' },
      { key: 'planned_date', label: 'Planned Date' },
      { key: 'scope', label: 'Scope' },
    ], data.plannedAudits, fonts, { fontSize: 8, rowHeight: 20 })
  } else {
    y = drawEmptyState(sectionPage, fonts, y, 'No planned audits for the next quarter.')
  }

  return finalizeDocument(doc)
}
