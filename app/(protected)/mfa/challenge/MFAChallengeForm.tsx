'use client'
// app/(protected)/mfa/challenge/MFAChallengeForm.tsx
// MFA challenge screen with three variants: TOTP, Email OTP, Backup code.
// Per UI-SPEC Screen 7.
// Shake animation on wrong code: 3-cycle, 4px horizontal, 120ms.
import { useState, useTransition } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import {
  completeMFAChallengeAction,
  verifyBackupCodeAction,
} from '@/lib/auth/mfa-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Variant = 'totp' | 'email-otp' | 'backup'

interface MFAChallengeFormProps {
  totpFactorId: string | null
  hasEmailOTP: boolean
  userEmail: string
}

export function MFAChallengeForm({ totpFactorId, hasEmailOTP, userEmail }: MFAChallengeFormProps) {
  const [variant, setVariant] = useState<Variant>(totpFactorId ? 'totp' : 'email-otp')
  const [code, setCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Email OTP state
  const [emailResendCooldown, setEmailResendCooldown] = useState(0)
  const [emailSent, setEmailSent] = useState(false)

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  function handleError(msg: string) {
    setError(msg)
    triggerShake()
  }

  function handleTOTPVerify() {
    if (!totpFactorId || code.length !== 6) return
    setError(null)
    startTransition(async () => {
      const result = await completeMFAChallengeAction(totpFactorId, code, trustDevice)
      if (result?.error) {
        handleError(result.error)
        setCode('')
      }
      // On success: redirect happens server-side
    })
  }

  function handleBackupCodeVerify() {
    if (!backupCode.trim()) return
    const trimmedBackupCode = backupCode.trim()
    setError(null)
    startTransition(async () => {
      const result = await verifyBackupCodeAction(trimmedBackupCode, trustDevice)
      if (result?.error) {
        handleError(result.error)
      }
    })
  }

  async function sendEmailOTP() {
    try {
      const res = await fetch('/api/mfa/email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      })
      if (res.ok) {
        setEmailSent(true)
        setEmailResendCooldown(60)
        const timer = setInterval(() => {
          setEmailResendCooldown((c) => {
            if (c <= 1) { clearInterval(timer); return 0 }
            return c - 1
          })
        }, 1000)
      } else {
        setError('Failed to send verification code. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
  }

  async function handleEmailOTPVerify() {
    if (code.length !== 6) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/mfa/email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', code }),
        })
        const data = await res.json()
        if (!res.ok) {
          handleError(data.error ?? 'Invalid verification code. Please try again.')
          setCode('')
          return
        }
        toast.success('Verification successful!')
        // For email OTP at challenge time, we still need to redirect.
        // Redirect to dashboard after successful email OTP verification.
        window.location.href = '/dashboard'
      } catch {
        handleError('Network error. Please try again.')
      }
    })
  }

  // ── TOTP variant ────────────────────────────────────────────────────────
  if (variant === 'totp') {
    return (
      <div>
        <h2 className="text-[20px] font-semibold text-navy-900 font-body mb-1">
          Two-factor authentication
        </h2>
        <p className="text-[14px] text-navy-mid font-body mb-6">
          Enter the 6-digit code from your authenticator app.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-[13px]">{error}</AlertDescription>
          </Alert>
        )}

        {/* OTP input with shake animation */}
        <div className={cn('mb-4', shake && 'animate-shake')}>
          <Input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className={cn(
              'font-mono text-[22px] text-center h-12 tracking-widest border-paper-border',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleTOTPVerify()}
          />
        </div>

        {/* Trust device checkbox */}
        <div className="flex items-center gap-2 mb-6">
          <Checkbox
            id="trust-device"
            checked={trustDevice}
            onCheckedChange={(v) => setTrustDevice(!!v)}
          />
          <label htmlFor="trust-device" className="text-[13px] text-navy-mid cursor-pointer select-none">
            Trust this device for 30 days
          </label>
        </div>

        <Button
          type="button"
          className="w-full h-11 bg-gold text-navy-950 hover:bg-gold-hi text-[15px] font-semibold mb-3"
          disabled={code.length !== 6 || isPending}
          onClick={handleTOTPVerify}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
        </Button>

        <div className="flex flex-col items-center gap-2 mt-2">
          {hasEmailOTP && (
            <button
              type="button"
              onClick={() => { setVariant('email-otp'); setCode(''); setError(null); if (!emailSent) sendEmailOTP() }}
              className="text-[13px] text-navy-mid hover:text-navy-900 underline underline-offset-2"
            >
              Use email verification code instead
            </button>
          )}
          <button
            type="button"
            onClick={() => { setVariant('backup'); setCode(''); setError(null) }}
            className="text-[13px] text-navy-mid hover:text-navy-900 underline underline-offset-2"
          >
            Use a backup code instead
          </button>
        </div>
      </div>
    )
  }

  // ── Email OTP variant ───────────────────────────────────────────────────
  if (variant === 'email-otp') {
    return (
      <div>
        <h2 className="text-[20px] font-semibold text-navy-900 font-body mb-1">
          Email verification
        </h2>
        <p className="text-[14px] text-navy-mid font-body mb-6">
          A 6-digit code has been sent to{' '}
          <strong className="text-navy-900">{userEmail}</strong>.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-[13px]">{error}</AlertDescription>
          </Alert>
        )}

        <div className={cn('mb-4', shake && 'animate-shake')}>
          <Input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className={cn(
              'font-mono text-[22px] text-center h-12 tracking-widest border-paper-border',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleEmailOTPVerify()}
          />
        </div>

        {/* Trust device */}
        <div className="flex items-center gap-2 mb-6">
          <Checkbox
            id="trust-device-email"
            checked={trustDevice}
            onCheckedChange={(v) => setTrustDevice(!!v)}
          />
          <label htmlFor="trust-device-email" className="text-[13px] text-navy-mid cursor-pointer select-none">
            Trust this device for 30 days
          </label>
        </div>

        <Button
          type="button"
          className="w-full h-11 bg-gold text-navy-950 hover:bg-gold-hi text-[15px] font-semibold mb-4"
          disabled={code.length !== 6 || isPending}
          onClick={handleEmailOTPVerify}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
        </Button>

        <div className="flex flex-col items-center gap-2">
          {/* Resend link */}
          {emailResendCooldown > 0 ? (
            <span className="text-[13px] text-navy-mid">
              Resend code in {emailResendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={sendEmailOTP}
              className="text-[13px] text-navy-mid hover:text-navy-900 underline underline-offset-2 inline-flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Resend code
            </button>
          )}

          {totpFactorId && (
            <button
              type="button"
              onClick={() => { setVariant('totp'); setCode(''); setError(null) }}
              className="text-[13px] text-navy-mid hover:text-navy-900 underline underline-offset-2"
            >
              ← Use authenticator app instead
            </button>
          )}

          <button
            type="button"
            onClick={() => { setVariant('backup'); setCode(''); setError(null) }}
            className="text-[13px] text-navy-mid hover:text-navy-900 underline underline-offset-2"
          >
            Use a backup code instead
          </button>
        </div>
      </div>
    )
  }

  // ── Backup code variant ─────────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-[20px] font-semibold text-navy-900 font-body mb-1">
        Use a backup code
      </h2>
      <p className="text-[14px] text-navy-mid font-body mb-4">
        Enter one of your saved backup codes. Each code can only be used once.
      </p>

      <Alert className="mb-4 border-gold/40 bg-gold-pale">
        <AlertDescription className="text-[13px] text-navy-900">
          After using a backup code, consider regenerating your codes from the dashboard.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="text-[13px]">{error}</AlertDescription>
        </Alert>
      )}

      <div className={cn('mb-6', shake && 'animate-shake')}>
        <Input
          type="text"
          value={backupCode}
          onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX"
          className={cn(
            'font-mono text-[18px] text-center h-12 tracking-widest border-paper-border',
            error && 'border-red-500 focus-visible:ring-red-500'
          )}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleBackupCodeVerify()}
        />
      </div>

      <Button
        type="button"
        className="w-full h-11 bg-gold text-navy-950 hover:bg-gold-hi text-[15px] font-semibold mb-4"
        disabled={!backupCode.trim() || isPending}
        onClick={handleBackupCodeVerify}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Use backup code'}
      </Button>

      <div className="flex flex-col items-center gap-2">
        {totpFactorId && (
          <button
            type="button"
            onClick={() => { setVariant('totp'); setBackupCode(''); setError(null) }}
            className="text-[13px] text-navy-mid hover:text-navy-900 underline underline-offset-2"
          >
            ← Use authenticator code instead
          </button>
        )}
        {hasEmailOTP && (
          <button
            type="button"
            onClick={() => { setVariant('email-otp'); setBackupCode(''); setError(null); if (!emailSent) sendEmailOTP() }}
            className="text-[13px] text-navy-mid hover:text-navy-900 underline underline-offset-2"
          >
            ← Use email verification code instead
          </button>
        )}
      </div>
    </div>
  )
}
