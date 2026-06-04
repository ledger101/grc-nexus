import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { COLORS } from './branding'

export const PAGE_WIDTH = 595.28
export const PAGE_HEIGHT = 841.89
export const MARGIN = 50
export const HEADER_HEIGHT = 60
export const FOOTER_HEIGHT = 30
export const CONTENT_TOP = PAGE_HEIGHT - HEADER_HEIGHT - 20
export const CONTENT_BOTTOM = FOOTER_HEIGHT + 20
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

export interface ReportMetadata {
  institution?: string
  reportTitle?: string
  reportId?: string
  generatedAt?: string
  classification?: string
  [key: string]: any
}

export interface DocState {
  pdfDoc: PDFDocument
  fonts: {
    helvetica: any
    helveticaBold: any
    helveticaOblique: any
  }
  metadata: ReportMetadata
}

export async function createBrandedDocument(metadata: ReportMetadata = {}): Promise<DocState> {
  const pdfDoc = await PDFDocument.create()
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  return {
    pdfDoc,
    fonts: { helvetica, helveticaBold, helveticaOblique },
    metadata: {
      institution: metadata.institution || 'Ministry of Finance',
      reportTitle: metadata.reportTitle || 'Governance Report',
      reportId: metadata.reportId || 'RPT-001',
      generatedAt: metadata.generatedAt || new Date().toISOString(),
      classification: metadata.classification || 'CONFIDENTIAL — INTERNAL USE ONLY',
      ...metadata,
    },
  }
}

export function drawHeader(page: any, docState: DocState, y = PAGE_HEIGHT) {
  const { fonts, metadata } = docState

  page.drawRectangle({
    x: 0, y: y - 40, width: PAGE_WIDTH, height: 40,
    color: COLORS.navy,
  })

  page.drawRectangle({
    x: 0, y: y - 42, width: PAGE_WIDTH, height: 2,
    color: COLORS.gold,
  })

  page.drawText(metadata.institution!, {
    x: MARGIN, y: y - 26,
    size: 12, font: fonts.helveticaBold, color: COLORS.white,
  })

  const titleWidth = fonts.helveticaBold.widthOfTextAtSize(metadata.reportTitle!, 10)
  page.drawText(metadata.reportTitle!, {
    x: (PAGE_WIDTH - titleWidth) / 2, y: y - 26,
    size: 10, font: fonts.helveticaBold, color: COLORS.white,
  })

  const idText = metadata.reportId!
  const idWidth = fonts.helvetica.widthOfTextAtSize(idText, 9)
  page.drawText(idText, {
    x: PAGE_WIDTH - MARGIN - idWidth, y: y - 26,
    size: 9, font: fonts.helvetica, color: COLORS.gold,
  })
}

export function drawFooter(page: any, docState: DocState, pageNumber: number, totalPages: number, y = FOOTER_HEIGHT) {
  const { fonts, metadata } = docState

  page.drawRectangle({
    x: 0, y: 0, width: PAGE_WIDTH, height: 24,
    color: COLORS.navy,
  })

  page.drawText(metadata.classification!, {
    x: MARGIN, y: 8,
    size: 8, font: fonts.helveticaBold, color: COLORS.gold,
  })

  const pageText = `Page ${pageNumber} of ${totalPages}`
  const pageWidth = fonts.helvetica.widthOfTextAtSize(pageText, 8)
  page.drawText(pageText, {
    x: PAGE_WIDTH - MARGIN - pageWidth, y: 8,
    size: 8, font: fonts.helvetica, color: COLORS.white,
  })

  const dateStr = new Date(metadata.generatedAt!).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const dateWidth = fonts.helvetica.widthOfTextAtSize(dateStr, 8)
  page.drawText(dateStr, {
    x: (PAGE_WIDTH - dateWidth) / 2, y: 8,
    size: 8, font: fonts.helvetica, color: COLORS.white,
  })
}

export async function addPage(docState: DocState, isFirstPage = false) {
  const { pdfDoc } = docState
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  if (!isFirstPage) {
    drawHeader(page, docState)
    drawFooter(page, docState, 1, 1)
  }

  return page
}

export async function finalizeDocument(docState: DocState): Promise<Uint8Array> {
  const { pdfDoc } = docState
  const pages = pdfDoc.getPages()
  const totalPages = pages.length

  pages.forEach((page, idx) => {
    drawFooter(page, docState, idx + 1, totalPages)
  })

  return pdfDoc.save()
}
