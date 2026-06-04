import { COLORS, getStatusColor } from '../engine/branding'
import { createBrandedDocument, addPage, finalizeDocument, CONTENT_TOP, MARGIN, CONTENT_WIDTH } from '../engine/layout'
import { drawTable } from '../engine/tables'

export async function buildRiskRegisterPdf(data: any, metadata: any = {}) {
  const doc = await createBrandedDocument({
    reportTitle: 'Risk Register Summary',
    reportId: 'RPT-002',
    ...metadata,
  })

  const page = await addPage(doc, true)
  const { fonts } = doc
  let y = CONTENT_TOP

  page.drawText('Risk Register Summary', {
    x: MARGIN, y, size: 24, font: fonts.helveticaBold, color: COLORS.navy,
  })
  y -= 32

  page.drawText(`Total Risks: ${data.risks?.length || 0} | Reporting Period: ${data.period || 'Current'}`, {
    x: MARGIN, y, size: 11, font: fonts.helveticaOblique, color: COLORS.mediumGray,
  })
  y -= 24

  page.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 1.5, color: COLORS.gold,
  })
  y -= 28

  // Score distribution summary
  const scoreBuckets: Record<string, number> = {}
  data.risks?.forEach((r: any) => {
    const score = (r.inherent_likelihood || 0) * (r.inherent_impact || 0)
    const bucket = score >= 15 ? 'Critical (15-25)' : score >= 10 ? 'High (10-14)' : score >= 5 ? 'Medium (5-9)' : 'Low (1-4)'
    scoreBuckets[bucket] = (scoreBuckets[bucket] || 0) + 1
  })

  if (Object.keys(scoreBuckets).length > 0) {
    page.drawText('Risk Score Distribution', {
      x: MARGIN, y, size: 14, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 24

    const bucketRows = Object.entries(scoreBuckets).map(([bucket, count]) => ({
      bucket, count: String(count),
      percentage: `${Math.round((count / data.risks.length) * 100)}%`,
    }))

    y = drawTable(page, y, [
      { key: 'bucket', label: 'Score Band' },
      { key: 'count', label: 'Count' },
      { key: 'percentage', label: '% of Total' },
    ], bucketRows, fonts)
    y -= 20
  }

  // Full risk register table
  if (data.risks?.length > 0) {
    page.drawText('Full Risk Register', {
      x: MARGIN, y, size: 14, font: fonts.helveticaBold, color: COLORS.navy,
    })
    y -= 28

    const risksWithScore = data.risks.map((r: any) => ({
      ...r,
      inherent_score: (r.inherent_likelihood || 0) * (r.inherent_impact || 0),
      residual_score: (r.residual_likelihood || 0) * (r.residual_impact || 0),
    }))

    y = drawTable(page, y, [
      { key: 'risk_id', label: 'ID' },
      { key: 'title', label: 'Risk' },
      { key: 'category', label: 'Category' },
      { key: 'inherent_score', label: 'Inh.' },
      { key: 'residual_score', label: 'Res.' },
      { key: 'treatment_status', label: 'Status' },
      { key: 'owner_name', label: 'Owner' },
    ], risksWithScore, fonts, {
      statusKey: 'treatment_status',
      statusColorFn: getStatusColor,
      fontSize: 8,
      rowHeight: 20,
    })
  }

  return finalizeDocument(doc)
}
