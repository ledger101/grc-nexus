'use client'
// app/(protected)/dashboard/MFAStatusSection.tsx
// MFA status display and backup code regeneration for admin/board-member roles.
// Per T-13: shows enrolled/not-enrolled state; "Regenerate backup codes" opens Dialog.
import { useState, useTransition } from 'react'
import { Shield, ShieldCheck, RefreshCw } from 'lucide-react'
import { regenerateBackupCodesAction } from '@/lib/auth/mfa-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BackupCodesStep } from '@/app/(protected)/mfa/setup/BackupCodesStep'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface MFAStatusSectionProps {
  mfaEnrolled: boolean
}

export function MFAStatusSection({ mfaEnrolled }: MFAStatusSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newCodes, setNewCodes] = useState<string[] | null>(null)
  const [regenerating, startTransition] = useTransition()

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateBackupCodesAction()
      if (result?.error) {
        toast.error(result.error)
        return
      }
      if (result?.codes) {
        setNewCodes(result.codes)
        setDialogOpen(true)
      }
    })
  }

  function handleClose() {
    setDialogOpen(false)
    setNewCodes(null)
    toast.success('New backup codes saved. Old codes are now invalid.')
  }

  return (
    <>
      <div className="bg-white rounded-[10px] border border-paper-border shadow-card p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {mfaEnrolled ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <Shield className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="text-[15px] font-semibold text-navy-900 font-body">
                Multi-factor authentication
              </p>
              <p className="text-[13px] text-navy-mid font-body">
                {mfaEnrolled
                  ? 'MFA is active on your account.'
                  : 'MFA is required for your role but not yet set up.'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!mfaEnrolled && (
              <Button
                asChild
                size="sm"
                className="h-8 bg-gold text-navy-950 hover:bg-gold-hi text-[13px]"
              >
                <a href="/mfa/setup">Set up MFA</a>
              </Button>
            )}
            {mfaEnrolled && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[13px] border-paper-border"
                disabled={regenerating}
                onClick={handleRegenerate}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${regenerating ? 'animate-spin' : ''}`} />
                Regenerate backup codes
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Regenerate backup codes dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>New backup codes generated</DialogTitle>
            <DialogDescription>
              Your previous backup codes are now invalid. Save these new codes before closing this dialog.
            </DialogDescription>
          </DialogHeader>
          {newCodes && (
            <BackupCodesStep
              codes={newCodes}
              onComplete={handleClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
