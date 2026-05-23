'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { incidentIntakeSchema, type IncidentIntakeInput } from '@/lib/schemas/incidents'
import { INCIDENT_CATEGORY_LABELS, type IncidentCategory } from '@/types/incidents'

type IntakePayload = IncidentIntakeInput & { institution_id: string }

const CATEGORY_OPTIONS = Object.entries(INCIDENT_CATEGORY_LABELS) as [IncidentCategory, string][]

export function IncidentReportForm({ institutionId }: { institutionId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<IncidentIntakeInput>({
    resolver: zodResolver(incidentIntakeSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      is_anonymous: false,
      reporter_name: '',
      reporter_contact: '',
    },
    mode: 'onBlur',
  })

  const isAnonymous = form.watch('is_anonymous')

  function onSubmit(values: IncidentIntakeInput) {
    setError(null)
    const payload: IntakePayload = {
      ...values,
      institution_id: institutionId,
    }

    if (payload.is_anonymous) {
      payload.reporter_name = null
      payload.reporter_contact = null
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/incidents/intake', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const result = (await response.json()) as {
          error?: string
          data?: { id: string; case_reference?: string }
        }

        if (!response.ok || result.error) {
          setError(result.error ?? 'Unable to submit incident report.')
          return
        }

        const caseReference = result.data?.case_reference ?? result.data?.id
        const query = new URLSearchParams({
          case: caseReference ?? 'Pending',
          category: values.category,
          anonymous: values.is_anonymous ? '1' : '0',
        })

        router.push(`/incidents/submitted?${query.toString()}`)
      } catch (submitError) {
        console.error('[IncidentReportForm] submit failed', submitError)
        setError('Unable to submit incident report. Please try again.')
      }
    })
  }

  return (
    <div className="max-w-3xl rounded-[10px] border border-paper-border bg-white p-8 shadow-card">
      {error && (
        <Alert variant="destructive" role="alert" aria-live="assertive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[14px] font-medium text-navy-900">
                  Incident Title <span className="text-err">*</span>
                </FormLabel>
                <FormControl>
                  <Input className="h-11 border-paper-border" placeholder="Briefly summarize what happened" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel className="text-[14px] font-medium text-navy-900">
                  Category <span className="text-err">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 border-paper-border">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel className="text-[14px] font-medium text-navy-900">
                  Description <span className="text-err">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[130px] resize-y border-paper-border"
                    placeholder="Describe what happened, where, and any immediate impacts."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_anonymous"
            render={({ field }) => (
              <FormItem className="mt-5 rounded-[8px] border border-paper-border bg-paper p-4">
                <div className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  </FormControl>
                  <div>
                    <FormLabel className="text-[14px] font-medium text-navy-900">Submit anonymously</FormLabel>
                    <p className="mt-1 text-[13px] text-navy-mid">
                      Anonymous mode strips name and contact fields before the report is stored.
                    </p>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isAnonymous && (
            <>
              <FormField
                control={form.control}
                name="reporter_name"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-[14px] font-medium text-navy-900">Your Name (optional)</FormLabel>
                    <FormControl>
                      <Input className="h-11 border-paper-border" placeholder="Enter your name" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reporter_contact"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-[14px] font-medium text-navy-900">Contact Info (optional)</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11 border-paper-border"
                        placeholder="Email or phone for follow-up"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className="mt-6 flex items-center gap-3">
            <Button
              type="submit"
              className="h-11 bg-gold px-8 text-[14px] font-semibold text-navy-950 hover:bg-gold-hi"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 border-paper-border text-[14px]"
              disabled={isPending}
              onClick={() => router.push('/incidents')}
            >
              Back to Incidents
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
