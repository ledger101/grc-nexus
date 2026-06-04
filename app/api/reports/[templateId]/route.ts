import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildReport, listTemplates } from '@/lib/reporting/pdf/index'
import { fetchReportData } from '@/lib/reporting/data-fetcher'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for institution
    const { data: profileRaw } = await supabase
      .from('user_profiles')
      .select('role, institution_id')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as any

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    // Only list templates on GET without a specific template ID
    if (templateId === 'list') {
      return NextResponse.json({ templates: listTemplates() })
    }

    // Fetch data for the report
    const reportData = await fetchReportData(templateId, supabase, profile.institution_id)

    // Generate PDF
    const pdfBytes = await buildReport(templateId, reportData, {
      institution: profile.institution_id,
      generatedAt: new Date().toISOString(),
    })

    // Return PDF as downloadable file
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${templateId}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (err: any) {
    console.error('Report generation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate report' }, { status: 500 })
  }
}
