'use client'
// ReadingForm.tsx — Client Component
// Record a KPI reading following RegisterForm.tsx pattern exactly.
// react-hook-form + Zod resolver, calls recordKpiReading Server Action on submit.
// Period format helper text rendered per D-12: YYYY-M##, YYYY-Q#, YYYY-H#, YYYY.
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { kpiReadingSchema, type KpiReadingInput } from '@/lib/schemas/strategic'
import { recordKpiReading } from '@/lib/strategic/actions'
import type { KpiFrequency } from '@/types/strategic'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'

// Period format helper text per D-12
const PERIOD_HELPER: Record<KpiFrequency, string> = {
  monthly:     'Format: YYYY-M## (e.g. 2026-M03)',
  quarterly:   'Format: YYYY-Q# (e.g. 2026-Q1)',
  semi_annual: 'Format: YYYY-H# (e.g. 2026-H1)',
  annual:      'Format: YYYY (e.g. 2026)',
}

interface ReadingFormProps {
  kpiId: string
  frequency: KpiFrequency
  unit?: string
}

export function ReadingForm({ kpiId, frequency, unit }: ReadingFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<KpiReadingInput>({
    resolver: zodResolver(kpiReadingSchema),
    defaultValues: {
      reporting_period: '',
      actual_value: '' as unknown as number,
      notes: '',
    },
    mode: 'onBlur',
  })

  function onSubmit(values: KpiReadingInput) {
    setError(null)
    startTransition(async () => {
      const result = await recordKpiReading(kpiId, values)
      if ('error' in result) {
        setError(result.error)
      } else {
        router.push(`/strategic/kpis/${kpiId}`)
      }
    })
  }

  return (
    <div className="bg-white rounded-[10px] border border-paper-border shadow-card p-8">
      {error && (
        <Alert variant="destructive" role="alert" aria-live="assertive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>

          {/* 1. Reporting Period */}
          <FormField
            control={form.control}
            name="reporting_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[14px] font-medium text-navy-900">Reporting Period</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={PERIOD_HELPER[frequency]}
                    className="h-11 border-paper-border font-mono"
                    {...field}
                  />
                </FormControl>
                <p className="text-[13px] text-navy-mid mt-1">{PERIOD_HELPER[frequency]}</p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 2. Actual Value */}
          <FormField
            control={form.control}
            name="actual_value"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel className="text-[14px] font-medium text-navy-900">
                  Actual Value{unit ? ` (${unit})` : ''}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter the actual value for this period"
                    className="h-11 border-paper-border"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 3. Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel className="text-[14px] font-medium text-navy-900">
                  Notes <span className="text-navy-mid font-normal">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any context or explanation for this reading..."
                    className="border-paper-border resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="mt-6 h-11 bg-gold text-navy-950 hover:bg-gold-hi font-semibold text-[14px] px-8"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Reading
          </Button>
        </form>
      </Form>
    </div>
  )
}
