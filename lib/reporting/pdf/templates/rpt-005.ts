import { COLORS, getStatusColor } from '../engine/branding'
import { createBrandedDocument, addPage, finalizeDocument, CONTENT_TOP, MARGIN, CONTENT_WIDTH } from '../engine/layout'
import { drawTable } from '../engine/tables'

export async function buildCompliancePdf(data: any, metadata: any = {}) {
  const doc = await createBrandedDocument({
    reportTitle: 'Compliance Obligations Status',
    reportId: 'RPT-005',
    ...metadata,
  })

  const page = await addPage(doc, true)
  const { fonts } = doc
  let y = CONTENT_TOP

  page.drawText('Compliance Obligations Status', {
    x: MARGIN, y, size: 24, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 32

  const stats = data.stats || {}
  page.drawText(`Total: ${stats.total || 0} | Compliant: ${stats.compliant || 0} | Non-Compliant: ${stats.nonCompliant || 0} | Due Soon: ${stats.dueSoon || 0}`, {
    x: MARGIN, y, size: 11, font: fonts.helveticaOblique, color: COLORS.mediumGray,
  })
  y -= 24

  page.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 1.5, color: COLORS.gold,
  })
  y -= 28

  // Regulation breakdown
  if (data.byRegulation?.length > 0) {
    page.drawText('Obligations by Regulation', {
      x: MARGIN, y, size: 14, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 28

    y = drawTable(page, y, [
      { key: 'regulation', label: 'Regulation' },
      { key: 'total', label: 'Total' },
      { key: 'compliant', label: 'Compliant' },
      { key: 'nonCompliant', label: 'Non-Compliant' },
      { key: 'dueSoon', label: 'Due Soon' },
    ], data.byRegulation, fonts)
    y -= 20
  }

  // Full obligations table
  if (data.obligations?.length > 0) {
    page.drawText('All Obligations', {
      x: MARGIN, y, size: 14, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 28

    y = drawTable(page, y, [
      { key: 'regulation', label: 'Regulation' },
      { key: 'obligation', label: 'Obligation' },
      { key: 'due_date', label: 'Due' },
      { key: 'status', label: 'Status' },
      { key: 'owner_name', label: 'Owner' },
    ], data.obligations, fonts, {
      statusKey: 'status',
      statusColorFn: getStatusColor,
      fontSize: 8,
      rowHeight: 20,
    })
  }

  return finalizeDocument(doc)
}
