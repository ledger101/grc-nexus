import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { getObligationById } from '@/lib/compliance/queries'
import { EvidenceUploadForm } from './EvidenceUploadForm'
import type { RegulatoryFramework } from '@/types/compliance'

export const dynamic = 'force-dynamic'

// Only admin and compliance-officer may upload evidence (D-32)
const WRITE_ROLES: AppRole[] = ['admin', 'compliance-officer']

interface PageProps {
  params: Promise<{ id: string }>
}

type ObligationSummary = {
  id: string
  title: string
  framework: RegulatoryFramework
}

export default async function EvidenceUploadPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  // Redirect non-WRITE_ROLES back to obligation detail (T-4-05-S)
  if (!activeRole || !WRITE_ROLES.includes(activeRole)) {
    redirect(`/compliance/obligations/${id}`)
  }

  const { data, error } = await getObligationById(supabase, id)

  if (error || !data) {
    notFound()
  }

  const obligation = data as unknown as ObligationSummary

  return (
    <div className="max-w-xl">
      {/* Breadcrumb */}
      <p className="mb-2 text-[14px] text-navy-mid">
        <Link href="/compliance" className="hover:underline">Compliance</Link>
        {' / '}
        <Link href={`/compliance/obligations/${obligation.id}`} className="hover:underline">
          {obligation.title}
        </Link>
        {' / '}
        <span className="text-navy-900">Upload Evidence</span>
      </p>

      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-navy-900">Upload Evidence</h1>
      </div>

      <EvidenceUploadForm
        obligationId={id}
        obligationTitle={obligation.title}
        obligationFramework={obligation.framework}
      />
    </div>
  )
}
