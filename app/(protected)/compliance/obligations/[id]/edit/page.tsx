import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { getObligationById } from '@/lib/compliance/queries'
import { ObligationEditForm } from './ObligationEditForm'
import type { RegulatoryFramework, ObligationStatus } from '@/types/compliance'

export const dynamic = 'force-dynamic'

const WRITE_ROLES: AppRole[] = ['admin', 'compliance-officer']

interface PageProps {
  params: Promise<{ id: string }>
}

type ObligationDetail = {
  id: string
  title: string
  description: string | null
  framework: RegulatoryFramework
  framework_reference: string | null
  owner_id: string | null
  due_date: string
  status: ObligationStatus
}

type UserProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
}

export default async function EditObligationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !WRITE_ROLES.includes(activeRole)) {
    redirect(`/compliance/obligations/${id}`)
  }

  const [obligationResult, profilesResult] = await Promise.all([
    getObligationById(supabase, id),
    supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .order('first_name', { ascending: true }),
  ])

  if (obligationResult.error || !obligationResult.data) {
    notFound()
  }

  const obligation = obligationResult.data as unknown as ObligationDetail
  const typedProfiles = (profilesResult.data ?? []) as unknown as UserProfileRow[]
  const users = typedProfiles.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
  }))

  return (
    <div>
      {/* Breadcrumb */}
      <p className="mb-2 text-[14px] text-navy-mid">
        <Link href="/compliance" className="hover:underline">Compliance</Link>
        {' / '}
        <Link href={`/compliance/obligations/${obligation.id}`} className="hover:underline">
          {obligation.title}
        </Link>
        {' / '}
        <span className="text-navy-900">Edit</span>
      </p>

      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-navy-900">Edit Obligation</h1>
        <p className="mt-1 text-[14px] text-navy-mid">Update obligation details</p>
      </div>

      <ObligationEditForm obligation={obligation} users={users} />
    </div>
  )
}
