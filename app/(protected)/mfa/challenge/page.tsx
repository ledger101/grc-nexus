// app/(protected)/mfa/challenge/page.tsx
// MFA challenge page — shown after login when MFA is required but not yet verified.
// Determines which MFA variant to show based on enrolled factors.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MFAChallengeForm } from './MFAChallengeForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Verification Required — GRC-Nexus',
}

export default async function MFAChallengePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // If user is already at aal2, no challenge needed
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel === 'aal2') {
    redirect('/dashboard')
  }

  // Get enrolled MFA factors
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const totpFactor = factors?.all?.find((f) => f.factor_type === 'totp' && f.status === 'verified')

  // Check if user has email OTP challenges (custom flow)
  // (we check by querying mfa_otp_challenges — if any exist, email OTP is "enrolled")
  const { data: otpChallenges } = await supabase
    .from('mfa_otp_challenges')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  const hasEmailOTP = !totpFactor && (otpChallenges && otpChallenges.length > 0 || true)
  // Default to email OTP if no TOTP factor — allows using email method

  // Get user email for display
  const admin = createAdminClient()
  const { data: authUserData } = await admin.auth.admin.getUserById(user.id)
  const userEmail = authUserData?.user?.email ?? ''

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-navy-900 mb-4">
            <span className="font-heading text-gold text-[20px] font-bold">G</span>
          </div>
          <h1 className="text-[28px] font-heading font-bold text-navy-900 tracking-tight">
            GRC-Nexus
          </h1>
          <p className="text-[14px] text-navy-mid mt-1 font-body">
            Verify your identity to continue
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[10px] border border-paper-border shadow-auth p-6">
          <MFAChallengeForm
            totpFactorId={totpFactor?.id ?? null}
            hasEmailOTP={hasEmailOTP}
            userEmail={userEmail}
          />
        </div>
      </div>
    </div>
  )
}
