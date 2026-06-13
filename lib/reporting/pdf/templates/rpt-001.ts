import { COLORS, getStatusColor } from '../engine/branding'
import { PAGE_WIDTH, MARGIN, CONTENT_WIDTH } from '../engine/layout'

export async function buildGovernanceSummaryPdf(data: any, metadata: any = {}) {
  const { createBrandedDocument, addPage, finalizeDocument, CONTENT_TOP, MARGIN, CONTENT_WIDTH } = await import('../engine/layout')
  const { drawTable } = await import('../engine/tables')

  const doc = await createBrandedDocument({
    reportTitle: 'Executive Governance Summary',
    reportId: 'RPT-001',
    ...metadata,
  })

  const page = await addPage(doc, true)
  const { fonts } = doc
  let y = CONTENT_TOP

  // Title
  page.drawText('Executive Governance Summary', {
    x: MARGIN, y, size: 24, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 32

  page.drawText(`Reporting Period: ${data.period || 'Current'}`, {
    x: MARGIN, y, size: 11, font: fonts.helveticaOblique, color: COLORS.mediumGray,
  })
  y -= 24

  // Gold divider
  page.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 1.5, color: COLORS.gold,
  })
  y -= 28

  // Stat cards
  const stats = data.stats || {}
  const cards = [
    { label: 'Open Risks', value: String(stats.openRisks || 0), color: (stats.openRisks || 0) > 5 ? COLORS.red : COLORS.navy },
    { label: 'Non-Compliant', value: String(stats.nonCompliant || 0), color: (stats.nonCompliant || 0) > 0 ? COLORS.red : COLORS.green },
    { label: 'Pending Actions', value: String(stats.pendingActions || 0), color: (stats.pendingActions || 0) > 3 ? COLORS.orange : COLORS.navy },
    { label: 'KPI Attainment', value: `${stats.kpiAttainment || 0}%`, color: (stats.kpiAttainment || 0) < 50 ? COLORS.red : COLORS.green },
    { label: 'Open Incidents', value: String(stats.openIncidents || 0), color: (stats.openIncidents || 0) > 0 ? COLORS.orange : COLORS.green },
    { label: 'Open Findings', value: String(stats.openFindings || 0), color: (stats.openFindings || 0) > 2 ? COLORS.orange : COLORS.green },
  ]

  const cardWidth = CONTENT_WIDTH / 3 - 10
  const cardHeight = 60
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
      x: cardX + 12, y: cardRowY - 20,
      size: 9, font: fonts.helvetica, color: COLORS.mediumGray,
    })
    page.drawText(card.value, {
      x: cardX + 12, y: cardRowY - 42,
      size: 20, font: fonts.helveticaBold, color: COLORS.navy,
    })
    cardCol++
    if (cardCol === 3) { cardCol = 0; cardRowY -= (cardHeight + 12) }
  })

  y = cardRowY - (cardCol > 0 ? cardHeight + 12 : 0) - 24

  // Tables
  if (data.risks?.length > 0) {
    page.drawText('Top Risks', { x: MARGIN, y, size: 14, font: fonts.helveticaBold, color: COLORS.navy })
    y -= 28
    y = drawTable(page, y, [
      { key: 'risk_id', label: 'ID' }, { key: 'title', label: 'Risk' },
      { key: 'category', label: 'Category' }, { key: 'inherent_score', label: 'Score' },
      { key: 'treatment_status', label: 'Status' },
    ], data.risks.slice(0, 8), fonts, { statusKey: 'treatment_status', statusColorFn: getStatusColor })
    y -= 16
  }

  if (data.compliance?.length > 0) {
    page.drawText('Compliance Obligations', { x: MARGIN, y, size: 14, font: fonts.helveticaBold, color: COLORS.navy })
    y -= 28
    y = drawTable(page, y, [
      { key: 'regulation', label: 'Regulation' }, { key: 'obligation', label: 'Obligation' },
      { key: 'status', label: 'Status' },
    ], data.compliance.slice(0, 8), fonts, { statusKey: 'status', statusColorFn: getStatusColor })
    y -= 16
  }

  if (data.actions?.length > 0) {
    page.drawText('Pending Board Actions', { x: MARGIN, y, size: 14, font: fonts.helveticaBold, color: COLORS.navy })
    y -= 28
    y = drawTable(page, y, [
      { key: 'description', label: 'Action' }, { key: 'due_date', label: 'Due' },
      { key: 'status', label: 'Status' },
    ], data.actions.slice(0, 8), fonts, { statusKey: 'status', statusColorFn: getStatusColor })
  }

  return finalizeDocument(doc)
}
