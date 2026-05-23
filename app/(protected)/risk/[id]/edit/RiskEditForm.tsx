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
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MatrixSelector } from '@/components/risk/MatrixSelector'
import { riskUpdateSchema, type RiskUpdateInput } from '@/lib/schemas/risk'
import { updateRisk } from '@/lib/risk/actions'
import { RISK_CATEGORY_LABELS, type RiskCategory } from '@/types/risk'

interface RiskEditFormProps {
  riskId: string
  initialValues: RiskUpdateInput
  objectives: { id: string; title: string }[]
  owners: { id: string; first_name: string | null; last_name: string | null }[]
}

const RISK_CATEGORY_OPTIONS = Object.entries(RISK_CATEGORY_LABELS) as [RiskCategory, string][]

export function RiskEditForm({ riskId, initialValues, objectives, owners }: RiskEditFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<RiskUpdateInput>({
    resolver: zodResolver(riskUpdateSchema),
    defaultValues: {
      ...initialValues,
      description: initialValues.description ?? '',
      mitigating_controls: initialValues.mitigating_controls ?? '',
    },
    mode: 'onBlur',
  })

  function onSubmit(values: RiskUpdateInput) {
    setError(null)
    startTransition(async () => {
      const result = await updateRisk(riskId, values)
      if ('error' in result) {
        setError(result.error)
        return
      }

      router.push(`/risk/${riskId}`)
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="objective_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-navy-900">Objective</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-paper-border">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {objectives.map((objective) => (
                        <SelectItem key={objective.id} value={objective.id}>
                          {objective.title}
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
              name="owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-navy-900">Owner</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-paper-border">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {[owner.first_name, owner.last_name].filter(Boolean).join(' ') || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel className="text-[14px] font-medium text-navy-900">Risk Title</FormLabel>
                <FormControl>
                  <Input className="h-11 border-paper-border" {...field} />
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
                <FormLabel className="text-[14px] font-medium text-navy-900">Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 border-paper-border">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RISK_CATEGORY_OPTIONS.map(([value, label]) => (
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
                <FormLabel className="text-[14px] font-medium text-navy-900">Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} className="resize-none border-paper-border" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mitigating_controls"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel className="text-[14px] font-medium text-navy-900">Mitigating Controls</FormLabel>
                <FormControl>
                  <Textarea rows={3} className="resize-none border-paper-border" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="my-6 border-t border-paper-border" />

          <div>
            <h3 className="text-[14px] font-semibold text-navy-900">Inherent Risk Score</h3>
            <div className="mt-2">
              <MatrixSelector
                idPrefix="edit-inherent"
                likelihood={form.watch('inherent_likelihood') ?? null}
                impact={form.watch('inherent_impact') ?? null}
                onChange={({ likelihood, impact }) => {
                  form.setValue('inherent_likelihood', likelihood, { shouldValidate: true })
                  form.setValue('inherent_impact', impact, { shouldValidate: true })
                }}
              />
            </div>
          </div>

          <div className="my-6 border-t border-paper-border" />

          <div>
            <h3 className="text-[14px] font-semibold text-navy-900">Residual Risk Score</h3>
            <div className="mt-2">
              <MatrixSelector
                idPrefix="edit-residual"
                likelihood={form.watch('residual_likelihood') ?? null}
                impact={form.watch('residual_impact') ?? null}
                onChange={({ likelihood, impact }) => {
                  form.setValue('residual_likelihood', likelihood, { shouldValidate: true })
                  form.setValue('residual_impact', impact, { shouldValidate: true })
                }}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="mt-6 h-11 bg-gold px-8 text-[14px] font-semibold text-navy-950 hover:bg-gold-hi"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Risk
          </Button>
        </form>
      </Form>
    </div>
  )
}
