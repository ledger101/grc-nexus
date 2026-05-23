import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { getObligationById } from '@/lib/compliance/queries'
import { AttestationForm } from './AttestationForm'
import type { RegulatoryFramework } from '@/types/compliance'

export const dynamic = 'force-dynamic'

// Only these roles may attest obligations (D-20)
const ATTEST_ROLES: AppRole[] = ['admin', 'ceo', 'compliance-officer']

interface PageProps {
  params: { id: string }
}

type ObligationSummary = {
  id: string
  title: string
  framework: RegulatoryFramework
  due_date: string
}

export default async function AttestObligationPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  // Redirect non-ATTEST_ROLES back to obligation detail (T-4-05-S2 page-level guard)
  if (!activeRole || !ATTEST_ROLES.includes(activeRole)) {
    redirect(`/compliance/obligations/${params.id}`)
  }

  const { data, error } = await getObligationById(supabase, params.id)

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
        <span className="text-navy-900">Attest</span>
      </p>

      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-navy-900">Record Attestation</h1>
      </div>

      <AttestationForm
        obligationId={params.id}
        obligationTitle={obligation.title}
        obligationFramework={obligation.framework}
        obligationDueDate={obligation.due_date}
      />
    </div>
  )
}
