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
import { auditFindingSchema, type AuditFindingInput } from '@/lib/schemas/audit-findings'
import { createAuditFinding } from '@/lib/audit/actions'
import { AUDIT_FINDING_SEVERITY_LABELS, AUDIT_LINKED_ENTITY_LABELS, type AuditFindingSeverity, type AuditLinkedEntityType } from '@/types/audit'

const SEVERITY_OPTIONS = Object.entries(AUDIT_FINDING_SEVERITY_LABELS) as [AuditFindingSeverity, string][]
const LINK_OPTIONS = Object.entries(AUDIT_LINKED_ENTITY_LABELS) as [AuditLinkedEntityType, string][]

interface AuditFindingFormProps {
  users: { id: string; first_name: string | null; last_name: string | null }[]
}

export function AuditFindingForm({ users }: AuditFindingFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<AuditFindingInput>({
    resolver: zodResolver(auditFindingSchema),
    defaultValues: {
      title: '',
      description: '',
      severity: 'medium',
      root_cause: '',
      linked_entity_type: 'risk',
      linked_entity_id: '',
      remediation_owner_id: '',
      review_date: '',
      due_date: '',
    },
    mode: 'onBlur',
  })

  function onSubmit(values: AuditFindingInput) {
    setError(null)
    startTransition(async () => {
      const result = await createAuditFinding(values)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.push(`/audit/findings/${result.data.id}`)
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
                  Finding Title <span className="text-err">*</span>
                </FormLabel>
                <FormControl>
                  <Input className="h-11 border-paper-border" placeholder="e.g. Late closure of high-risk controls" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel className="text-[14px] font-medium text-navy-900">Finding Narrative</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[90px] resize-none border-paper-border" placeholder="Describe what was observed." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="root_cause"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel className="text-[14px] font-medium text-navy-900">
                  Root Cause <span className="text-err">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea className="min-h-[80px] resize-none border-paper-border" placeholder="Explain why the issue occurred." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Severity <span className="text-err">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-paper-border">
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remediation_owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Remediation Owner <span className="text-err">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-paper-border">
                        <SelectValue placeholder="Select owner" />
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
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="linked_entity_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Linked Entity Type <span className="text-err">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-paper-border">
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LINK_OPTIONS.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linked_entity_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Linked Entity ID <span className="text-err">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input className="h-11 border-paper-border font-mono" placeholder="UUID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="review_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Review Date <span className="text-err">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" className="h-11 border-paper-border font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-navy-900">
                    Remediation Due Date <span className="text-err">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" className="h-11 border-paper-border font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button type="submit" className="h-11 bg-gold px-8 text-[14px] font-semibold text-navy-950 hover:bg-gold-hi" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Finding
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 border-paper-border text-[14px]"
              onClick={() => router.push('/audit/findings')}
              disabled={isPending}
            >
              Back to Findings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
