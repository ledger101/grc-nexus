'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { meetingSchema } from '@/lib/schemas/board'
import { createMeeting, updateMeeting } from '@/lib/board/actions'

interface MemberOption {
  id: string
  name: string
}

interface MeetingFormValues {
  title: string
  meeting_date: string
  location?: string
  attendee_ids: string[]
}

export function MeetingForm({
  members,
  initialValues,
  meetingId,
}: {
  members: MemberOption[]
  initialValues?: {
    title: string
    meeting_date: string
    location?: string | null
    agenda_items: string[]
    attendee_ids: string[]
  }
  meetingId?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [agendaItems, setAgendaItems] = useState<string[]>(initialValues?.agenda_items?.length ? initialValues.agenda_items : [''])

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema.pick({ title: true, meeting_date: true, location: true, attendee_ids: true })),
    defaultValues: {
      title: initialValues?.title ?? '',
      meeting_date: initialValues?.meeting_date ? initialValues.meeting_date.slice(0, 16) : '',
      location: initialValues?.location ?? '',
      attendee_ids: initialValues?.attendee_ids ?? [],
    },
  })

  function toggleAttendee(id: string) {
    const current = form.getValues('attendee_ids')
    if (current.includes(id)) {
      form.setValue('attendee_ids', current.filter((item) => item !== id))
    } else {
      form.setValue('attendee_ids', [...current, id])
    }
  }

  function addAgendaItem() {
    setAgendaItems((prev) => [...prev, ''])
  }

  function removeAgendaItem(index: number) {
    if (agendaItems.length === 1) return
    setAgendaItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  function updateAgendaItem(index: number, value: string) {
    setAgendaItems((prev) => prev.map((item, idx) => (idx === index ? value : item)))
  }

  function onSubmit(values: MeetingFormValues) {
    setError(null)

    const payload = {
      title: values.title,
      meeting_date: new Date(values.meeting_date),
      location: values.location || null,
      attendee_ids: values.attendee_ids,
      agenda_items: agendaItems.map((item) => item.trim()).filter(Boolean),
    }

    startTransition(async () => {
      const result = meetingId
        ? await updateMeeting(meetingId, payload)
        : await createMeeting(payload)

      if ('error' in result) {
        setError(result.error)
        return
      }

      router.push(`/board/meetings/${result.data.id}`)
      router.refresh()
    })
  }

  return (
    <div className="rounded-[10px] border border-paper-border bg-white p-6 shadow-card">
      {error && <p className="mb-3 text-[13px] text-red-600">{error}</p>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Quarterly Board Session" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meeting_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting date and time</FormLabel>
                <FormControl>
                  <Input {...field} type="datetime-local" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} placeholder="Boardroom A" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <FormLabel>Agenda items</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={addAgendaItem}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {agendaItems.map((item, index) => (
                <div key={`agenda-${index}`} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateAgendaItem(index, e.target.value)}
                    placeholder={`Agenda item ${index + 1}`}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => removeAgendaItem(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <FormLabel>Attendees</FormLabel>
            <div className="mt-2 grid grid-cols-1 gap-2 rounded border border-paper-border p-3 sm:grid-cols-2">
              {members.map((member) => {
                const checked = form.watch('attendee_ids').includes(member.id)
                return (
                  <label key={member.id} className="flex items-center gap-2 text-[13px] text-navy-900">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAttendee(member.id)}
                    />
                    <span>{member.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="bg-gold text-navy-950 hover:bg-gold-hi" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {meetingId ? 'Save Changes' : 'Create Meeting'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/board/meetings')}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
