'use client'
// app/(protected)/admin/audit-log/DiffViewer.tsx
// JSONB diff viewer for audit log inline expansion.
// Highlights changed fields: deleted (red in before), added/changed (green in after).
// Per UI-SPEC Screen 8 — DM Mono 13px, #F3F7FD background, max-height 200px scroll.
import type { Json } from '@/types/supabase'

interface DiffViewerProps {
  before: Json | null
  after: Json | null
}

function asObject(json: Json | null): Record<string, unknown> | null {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    return json as Record<string, unknown>
  }
  return null
}

function getChangedKeys(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): Set<string> {
  const changed = new Set<string>()
  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ])
  for (const key of allKeys) {
    const bVal = JSON.stringify((before ?? {})[key])
    const aVal = JSON.stringify((after ?? {})[key])
    if (bVal !== aVal) changed.add(key)
  }
  return changed
}

function JsonValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">null</span>
  }
  if (typeof value === 'string') {
    return <span className="text-green-800">&quot;{value}&quot;</span>
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-blue-700">{String(value)}</span>
  }
  return <span>{JSON.stringify(value, null, 2)}</span>
}

export function DiffViewer({ before, after }: DiffViewerProps) {
  const beforeObject = asObject(before)
  const afterObject = asObject(after)
  const changedKeys = getChangedKeys(beforeObject, afterObject)
  const allBeforeKeys = Object.keys(beforeObject ?? {})
  const allAfterKeys = Object.keys(afterObject ?? {})

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Before column */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-mid mb-1.5">
          Before
        </p>
        <div
          className="bg-paper border border-paper-border rounded-[6px] p-3 overflow-auto"
          style={{ maxHeight: 200, fontFamily: 'var(--font-dm-mono), monospace', fontSize: 13 }}
        >
          {beforeObject === null ? (
            <span className="text-gray-400 italic text-[12px]">—</span>
          ) : allBeforeKeys.length === 0 ? (
            <span className="text-gray-400 italic text-[12px]">empty</span>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {allBeforeKeys.map((key) => {
                  const isChanged = changedKeys.has(key)
                  const isDeleted = !(afterObject ?? {}).hasOwnProperty(key)
                  return (
                    <tr
                      key={key}
                      className={
                        isDeleted
                          ? 'bg-red-50'
                          : isChanged
                          ? 'bg-red-50'
                          : ''
                      }
                    >
                      <td className="pr-2 py-0.5 align-top whitespace-nowrap">
                        <span className={isChanged || isDeleted ? 'text-red-700 font-semibold' : 'text-navy-mid'}>
                          {key}:
                        </span>
                      </td>
                      <td className="py-0.5 align-top break-all">
                        <span className={isChanged || isDeleted ? 'text-red-800' : 'text-navy-900'}>
                          <JsonValue value={(beforeObject ?? {})[key]} />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* After column */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-mid mb-1.5">
          After
        </p>
        <div
          className="bg-paper border border-paper-border rounded-[6px] p-3 overflow-auto"
          style={{ maxHeight: 200, fontFamily: 'var(--font-dm-mono), monospace', fontSize: 13 }}
        >
          {afterObject === null ? (
            <span className="text-gray-400 italic text-[12px]">—</span>
          ) : allAfterKeys.length === 0 ? (
            <span className="text-gray-400 italic text-[12px]">empty</span>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {allAfterKeys.map((key) => {
                  const isChanged = changedKeys.has(key)
                  const isAdded = !(beforeObject ?? {}).hasOwnProperty(key)
                  return (
                    <tr
                      key={key}
                      className={isChanged || isAdded ? 'bg-green-50' : ''}
                    >
                      <td className="pr-2 py-0.5 align-top whitespace-nowrap">
                        <span className={isChanged || isAdded ? 'text-green-700 font-semibold' : 'text-navy-mid'}>
                          {key}:
                        </span>
                      </td>
                      <td className="py-0.5 align-top break-all">
                        <span className={isChanged || isAdded ? 'text-green-800' : 'text-navy-900'}>
                          <JsonValue value={(afterObject ?? {})[key]} />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
