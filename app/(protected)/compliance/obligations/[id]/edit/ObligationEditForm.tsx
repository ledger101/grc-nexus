'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { obligationSchema, type ObligationInput } from '@/lib/schemas/compliance'
import { updateObligation } from '@/lib/compliance/actions'
import {
  REGULATORY_FRAMEWORK_LABELS,
  OBLIGATION_STATUS_LABELS,
  type RegulatoryFramework,
  type ObligationStatus,
} from '@/types/compliance'
import { cn } from '@/lib/utils'
import { OBLIGATION_STATUS_BADGE } from '@/lib/compliance/compliance-utils'

const FRAMEWORK_OPTIONS = Object.entries(REGULATORY_FRAMEWORK_LABELS) as [RegulatoryFramework, string][]

interface ObligationEditFormProps {
  obligation: {
    id: string
    title: string
    description: string | null
    framework: RegulatoryFramework
    framework_reference: string | null
    owner_id: string | null
    due_date: string
    status: ObligationStatus
  }
  users: { id: string; first_name: string | null; last_name: string | null }[]
}

export function ObligationEditForm({ obligation, users }: ObligationEditFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ObligationInput>({
    resolver: zodResolver(obligationSchema),
    defaultValues: {
      title: obligation.title,
      description: obligation.description ?? '',
      framework: obligation.framework,
      framework_reference: obligation.framework_reference ?? '',
      owner_id: obligation.owner_id ?? '',
      due_date: obligation.due_date,
    },
    mode: 'onBlur',
  })

  const watchedFramework = form.watch('framework')
  const isOtherFramework = watchedFramework === 'other'

  function onSubmit(values: ObligationInput) {
    setError(null)
    startTransition(async () => {
      const result = await updateObligation(obligation.id, values)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.push(`/compliance/obligations/${obligation.id}`)
    })
  }

  return (
    <div className="max-w-3xl">
      {/* Read-only alert: status changes via attestation workflow */}
      <Alert className="mb-6">
        <AlertDescription>
          Compliance status is updated through the attestation workflow, not this form.
        </AlertDescription>
      </Alert>

      {/* Current status — static badge (read-only) */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-[14px] text-navy-mid">Current status:</span>
        <span
          className={cn('inline-flex font-medium', OBLIGATION_STATUS_BADGE[obligation.status])}
          aria-label={`Compliance status: ${OBLIGATION_STATUS_LABELS[obligation.status]}`}
        >
          {OBLIGATION_STATUS_LABELS[obligation.status]}
        </span>
      </div>

      <div className="rounded-[10px] border border-paper-border bg-white p-8 shadow-card">
        {error && (
          <Alert variant="destructive" role="alert" aria-live="assertive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            {/* 1. Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Obligation Title <span className="text-err">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-paper-border"
                      placeholder="e.g. Annual PECOGA compliance return"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-[14px] font-medium text-navy-900">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px] resize-none border-paper-border"
                      placeholder="Describe the compliance requirement in detail (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Regulatory Framework */}
            <FormField
              control={form.control}
              name="framework"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Regulatory Framework <span className="text-err">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-paper-border">
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FRAMEWORK_OPTIONS.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. Framework Reference */}
            <FormField
              control={form.control}
              name="framework_reference"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Framework Reference
                    {isOtherFramework && <span className="text-err"> *</span>}
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 border-paper-border"
                      placeholder="e.g. Section 14(2)(b) of the Public Finance Act"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[12px] text-navy-mid">
                    Provide the specific section, clause, or act reference.
                    {isOtherFramework && ' Required when framework is set to Other.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5. Owner */}
            <FormField
              control={form.control}
              name="owner_id"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Owner <span className="text-err">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-paper-border">
                        <SelectValue placeholder="Select obligation owner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {[u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 6. Due Date */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Due Date <span className="text-err">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="h-11 border-paper-border font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action buttons */}
            <div className="mt-6 flex items-center gap-3">
              <Button
                type="submit"
                className="h-11 bg-gold px-8 text-[14px] font-semibold text-navy-950 hover:bg-gold-hi"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Obligation
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 border-paper-border text-[14px]"
                onClick={() => router.push(`/compliance/obligations/${obligation.id}`)}
                disabled={isPending}
              >
                Back to Obligation
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
