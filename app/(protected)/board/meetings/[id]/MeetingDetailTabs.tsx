'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { updateMeetingStatus, closeMeeting } from '@/lib/board/actions'
import type { BoardActionItemRow, BoardDocumentRow, BoardMeetingRow, BoardResolutionRow } from '@/types/board'
import { AgendaList } from '@/components/board/AgendaList'
import { DocumentList } from '@/components/board/DocumentList'
import { ResolutionList } from '@/components/board/ResolutionList'
import { ActionItemList } from '@/components/board/ActionItemList'

type TabKey = 'agenda' | 'documents' | 'resolutions' | 'actions'

export function MeetingDetailTabs({
  meeting,
  documents,
  resolutions,
  actionItems,
  canWrite,
  canRecord,
}: {
  meeting: BoardMeetingRow
  documents: BoardDocumentRow[]
  resolutions: BoardResolutionRow[]
  actionItems: BoardActionItemRow[]
  canWrite: boolean
  canRecord: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('agenda')
  const [isPending, startTransition] = useTransition()
  const meetingClosed = meeting.status === 'closed'
  const meetingInProgress = meeting.status === 'in_progress'

  function startMeeting() {
    startTransition(async () => {
      const result = await updateMeetingStatus(meeting.id, 'in_progress')
      if (!('error' in result)) {
        router.refresh()
      }
    })
  }

  function closeCurrentMeeting() {
    startTransition(async () => {
      const result = await closeMeeting(meeting.id)
      if (!('error' in result)) {
        router.refresh()
      }
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button variant={tab === 'agenda' ? 'default' : 'outline'} onClick={() => setTab('agenda')}>Agenda</Button>
          <Button variant={tab === 'documents' ? 'default' : 'outline'} onClick={() => setTab('documents')}>Documents</Button>
          <Button variant={tab === 'resolutions' ? 'default' : 'outline'} onClick={() => setTab('resolutions')}>Resolutions</Button>
          <Button variant={tab === 'actions' ? 'default' : 'outline'} onClick={() => setTab('actions')}>Actions</Button>
        </div>

        <div className="flex gap-2">
          {canWrite && !meetingClosed && !meetingInProgress && (
            <Button onClick={startMeeting} disabled={isPending} className="bg-navy-900 text-white hover:bg-navy-900/90">
              Start Meeting
            </Button>
          )}

          {canRecord && !meetingClosed && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={isPending}>Close Meeting</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close this meeting?</DialogTitle>
                  <DialogDescription>
                    This action is irreversible. Closed meetings become immutable and no further edits/resolutions/uploads are allowed.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={closeCurrentMeeting}>Confirm Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-[10px] border border-paper-border bg-white p-5 shadow-card">
        {tab === 'agenda' && <AgendaList meeting={meeting} />}
        {tab === 'documents' && <DocumentList meetingId={meeting.id} documents={documents} canUpload={canWrite && !meetingClosed} />}
        {tab === 'resolutions' && (
          <ResolutionList
            meetingId={meeting.id}
            resolutions={resolutions}
            canCreate={canRecord && !meetingClosed}
            meetingInProgress={meetingInProgress}
          />
        )}
        {tab === 'actions' && (
          <ActionItemList
            meetingId={meeting.id}
            actionItems={actionItems}
            canCreate={canWrite}
            meetingClosed={meetingClosed}
          />
        )}
      </div>
    </div>
  )
}
