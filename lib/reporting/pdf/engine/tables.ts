import { COLORS, getStatusColor } from './branding'
import { PAGE_WIDTH, MARGIN, CONTENT_WIDTH } from './layout'

export function calculateColumnWidths(headers: any[], data: any[], fonts: any, fontSize = 9) {
  const minWidths = headers.map(h => {
    const headerWidth = fonts.helveticaBold.widthOfTextAtSize(h.label || h, fontSize + 1)
    return headerWidth + 16
  })

  data.forEach(row => {
    headers.forEach((h, idx) => {
      const key = h.key || h
      const cellText = String(row[key] || row[idx] || '').substring(0, 80)
      const cellWidth = fonts.helvetica.widthOfTextAtSize(cellText, fontSize)
      minWidths[idx] = Math.max(minWidths[idx], cellWidth + 16)
    })
  })

  const total = minWidths.reduce((a, b) => a + b, 0)
  if (total > CONTENT_WIDTH) {
    const scale = CONTENT_WIDTH / total
    return minWidths.map(w => w * scale)
  }
  return minWidths
}

export function drawTable(
  page: any, startY: number, headers: any[], data: any[], fonts: any,
  options: any = {}
) {
  const {
    fontSize = 9, headerFontSize = 10, rowHeight = 22, headerHeight = 28,
    x = MARGIN, maxRows = null, statusKey = null, statusColorFn = null,
  } = options

  const colWidths = calculateColumnWidths(headers, data, fonts, fontSize)
  const tableWidth = colWidths.reduce((a, b) => a + b, 0)
  let currentY = startY

  // Header row
  page.drawRectangle({
    x, y: currentY - headerHeight, width: tableWidth, height: headerHeight,
    color: COLORS.navy,
  })

  let colX = x
  headers.forEach((h, idx) => {
    const label = h.label || h
    page.drawText(label, {
      x: colX + 6, y: currentY - headerHeight + 8,
      size: headerFontSize, font: fonts.helveticaBold, color: COLORS.white,
    })
    colX += colWidths[idx]
  })
  currentY -= headerHeight

  const rowsToDraw = maxRows ? data.slice(0, maxRows) : data

  rowsToDraw.forEach((row: any, rowIdx: number) => {
    const rowColor = rowIdx % 2 === 0 ? COLORS.white : COLORS.paper
    page.drawRectangle({
      x, y: currentY - rowHeight, width: tableWidth, height: rowHeight,
      color: rowColor,
    })
    page.drawLine({
      start: { x, y: currentY - rowHeight },
      end: { x: x + tableWidth, y: currentY - rowHeight },
      thickness: 0.5, color: COLORS.lightGray,
    })

    colX = x
    headers.forEach((h, idx) => {
      const key = h.key || h
      let cellText = String(row[key] || row[idx] || '')
      if (cellText.length > 60) cellText = cellText.substring(0, 57) + '...'

      let cellColor = COLORS.black
      if (statusKey && key === statusKey) {
        const status = row[statusKey]
        cellColor = statusColorFn ? statusColorFn(status) : COLORS.mediumGray
      }

      page.drawText(cellText, {
        x: colX + 6, y: currentY - rowHeight + 6,
        size: fontSize, font: fonts.helvetica, color: cellColor,
      })
      colX += colWidths[idx]
    })
    currentY -= rowHeight
  })

  // Outer border
  page.drawRectangle({
    x, y: currentY, width: tableWidth, height: startY - currentY,
    borderColor: COLORS.navy, borderWidth: 1,
  })

  return currentY
}
