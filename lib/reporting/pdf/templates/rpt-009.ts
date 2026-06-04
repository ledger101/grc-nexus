import { COLORS, getStatusColor } from '../engine/branding'
import { createBrandedDocument, addPage, finalizeDocument, CONTENT_TOP, MARGIN, CONTENT_WIDTH } from '../engine/layout'
import { drawTable } from '../engine/tables'

export async function buildBoardActionsPdf(data: any, metadata: any = {}) {
  const doc = await createBrandedDocument({
    reportTitle: 'Board Action Tracker',
    reportId: 'RPT-009',
    ...metadata,
  })

  const page = await addPage(doc, true)
  const { fonts } = doc
  let y = CONTENT_TOP

  page.drawText('Board Action Tracker', {
    x: MARGIN, y, size: 24, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 32

  const stats = data.stats || {}
  page.drawText(`Total: ${stats.total || 0} | Pending: ${stats.pending || 0} | In Progress: ${stats.inProgress || 0} | Overdue: ${stats.overdue || 0} | Completed: ${stats.completed || 0}`, {
    x: MARGIN, y, size: 11, font: fonts.helveticaOblique, color: COLORS.mediumGray,
  })
  y -= 24

  page.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 1.5, color: COLORS.gold,
  })
  y -= 28

  // Status summary cards
  const cards = [
    { label: 'Pending', value: String(stats.pending || 0), color: COLORS.orange },
    { label: 'In Progress', value: String(stats.inProgress || 0), color: COLORS.navy },
    { label: 'Overdue', value: String(stats.overdue || 0), color: COLORS.red },
    { label: 'Completed', value: String(stats.completed || 0), color: COLORS.green },
  ]

  const cardWidth = CONTENT_WIDTH / 4 - 10
  const cardHeight = 55
  let cardX = MARGIN
  cards.forEach(card => {
    page.drawRectangle({
      x: cardX, y: y - cardHeight, width: cardWidth, height: cardHeight,
      color: COLORS.paper, borderColor: COLORS.lightGray, borderWidth: 0.5,
    })
    page.drawRectangle({
      x: cardX, y: y - cardHeight, width: 4, height: cardHeight,
      color: card.color,
    })
    page.drawText(card.label, {
      x: cardX + 10, y: y - 18,
      size: 8, font: fonts.helvetica, color: COLORS.mediumGray,
    })
    page.drawText(card.value, {
      x: cardX + 10, y: y - 38,
      size: 18, font: fonts.helveticaBold, color: COLORS.navy,
    })
    cardX += cardWidth + 12
  })
  y -= (cardHeight + 20)

  // Full actions table
  if (data.actions?.length > 0) {
    page.drawText('All Board Actions', {
      x: MARGIN, y, size: 14, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 28

    y = drawTable(page, y, [
      { key: 'description', label: 'Action' },
      { key: 'meeting_title', label: 'Meeting' },
      { key: 'assigned_to_name', label: 'Assignee' },
      { key: 'due_date', label: 'Due' },
      { key: 'status', label: 'Status' },
    ], data.actions, fonts, {
      statusKey: 'status',
      statusColorFn: getStatusColor,
      fontSize: 8,
      rowHeight: 20,
    })
  }

  return finalizeDocument(doc)
}
