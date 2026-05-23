'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { attestationSchema, type AttestationInput } from '@/lib/schemas/compliance'
import { attestObligation } from '@/lib/compliance/actions'
import {
  REGULATORY_FRAMEWORK_LABELS,
  ATTESTATION_STATUS_LABELS,
  type RegulatoryFramework,
} from '@/types/compliance'

const ATTESTATION_OPTIONS = [
  {
    value: 'compliant' as const,
    icon: CheckCircle2,
    iconColor: 'text-ok',
    label: 'Compliant',
    description: 'All requirements for this obligation have been fulfilled.',
  },
  {
    value: 'partially_compliant' as const,
    icon: AlertCircle,
    iconColor: 'text-warn',
    label: 'Partially Compliant',
    description: 'Some requirements met; corrective actions are in progress.',
  },
  {
    value: 'non_compliant' as const,
    icon: XCircle,
    iconColor: 'text-err',
    label: 'Non-Compliant',
    description: 'Requirements have not been met. Corrective action required.',
  },
]

// Regulatory framework badge — inline per UI-SPEC Component 30
function FrameworkBadge({ framework }: { framework: RegulatoryFramework }) {
  const classes: Record<RegulatoryFramework, string> = {
    pecoga:    'bg-purple-50 text-purple-700 border border-purple-200',
    ppdpa:     'bg-blue-50 text-blue-700 border border-blue-200',
    nds2:      'bg-teal-50 text-teal-700 border border-teal-200',
    iso_37000: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    king_iv:   'bg-amber-50 text-amber-700 border border-amber-200',
    ipsas:     'bg-cyan-50 text-cyan-700 border border-cyan-200',
    pfma:      'bg-orange-50 text-orange-700 border border-orange-200',
    other:     'bg-gray-100 text-gray-600 border border-gray-300',
  }
  return (
    <span className={cn('inline-flex rounded-[6px] px-[8px] py-[4px] text-[14px] font-medium', classes[framework])}>
      {REGULATORY_FRAMEWORK_LABELS[framework]}
    </span>
  )
}

interface AttestationFormProps {
  obligationId: string
  obligationTitle: string
  obligationFramework: RegulatoryFramework
  obligationDueDate: string
}

export function AttestationForm({
  obligationId,
  obligationTitle,
  obligationFramework,
  obligationDueDate,
}: AttestationFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<AttestationInput>({
    resolver: zodResolver(attestationSchema),
    defaultValues: {
      attestation_status: undefined,
      notes: '',
    },
    mode: 'onSubmit',
  })

  const { register, watch } = form

  function onSubmit(values: AttestationInput) {
    setError(null)
    startTransition(async () => {
      const result = await attestObligation(obligationId, values)
      if ('error' in result) {
        setError(result.error)
        return
      }
      toast.success(
        `Attestation recorded — ${ATTESTATION_STATUS_LABELS[values.attestation_status]}. Audit entry created.`,
        { duration: 5000 }
      )
      router.push(`/compliance/obligations/${obligationId}`)
    })
  }

  return (
    <div>
      {/* Context card: obligation summary above the form card (UI-SPEC Screen 6) */}
      <div className="mt-[8px] rounded-grc-sm border border-paper-border bg-gold-pale/30 p-[8px]">
        <p className="text-[14px] text-navy-mid">
          Attesting: <span className="font-semibold text-navy-900">{obligationTitle}</span>
        </p>
        <div className="mt-[4px] flex items-center gap-[8px]">
          <FrameworkBadge framework={obligationFramework} />
          <span className="font-mono text-[14px] text-navy-mid">Due: {obligationDueDate}</span>
        </div>
      </div>

      <div className="mt-6 rounded-[10px] border border-paper-border bg-white p-8 shadow-card">
        {error && (
          <Alert variant="destructive" role="alert" aria-live="assertive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>

            {/* Compliance Status radio cards (UI-SPEC Screen 6) */}
            <FormField
              control={form.control}
              name="attestation_status"
              render={() => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Compliance status <span className="text-err">*</span>
                  </FormLabel>
                  <FormControl>
                    <div
                      role="radiogroup"
                      aria-label="Select compliance status"
                      className="mt-2 flex flex-col gap-[8px]"
                    >
                      {ATTESTATION_OPTIONS.map((option) => {
                        const isSelected = watch('attestation_status') === option.value
                        return (
                          <label
                            key={option.value}
                            className={cn(
                              'flex cursor-pointer items-center gap-[12px] rounded-grc-sm border p-[16px] transition-colors',
                              isSelected
                                ? 'border-gold bg-gold-pale/20'
                                : 'border-paper-border hover:bg-paper/50'
                            )}
                          >
                            <input
                              type="radio"
                              value={option.value}
                              {...register('attestation_status')}
                              className="sr-only"
                              aria-label={`${option.label}: ${option.description}`}
                            />
                            <option.icon
                              className={cn('h-5 w-5 flex-shrink-0', option.iconColor)}
                              aria-hidden="true"
                            />
                            <div>
                              <p className="text-[14px] font-semibold text-navy-900">{option.label}</p>
                              <p className="text-[14px] text-navy-mid">{option.description}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes — optional */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Attestation notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px] resize-none border-paper-border"
                      placeholder="Describe the basis for this attestation, any conditions, or corrective actions in progress"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Digital signature notice (UI-SPEC Screen 6) */}
            <Alert
              role="note"
              aria-label="Attestation will be recorded in the immutable audit trail"
              className="mt-[16px]"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>This attestation will be signed</AlertTitle>
              <AlertDescription>
                Your user identity, the current timestamp, and this status will be recorded in the
                immutable audit trail. This record cannot be modified after submission.
              </AlertDescription>
            </Alert>

            {/* Form footer */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 border-paper-border text-[14px]"
                onClick={() => router.push(`/compliance/obligations/${obligationId}`)}
                disabled={isPending}
              >
                Back to Obligation
              </Button>
              <Button
                type="submit"
                className="h-11 bg-gold px-8 text-[14px] font-semibold text-navy-950 hover:bg-gold-hi"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Submitting...' : 'Submit Attestation'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
