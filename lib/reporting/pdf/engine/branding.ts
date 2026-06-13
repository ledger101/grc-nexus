import { rgb } from 'pdf-lib'

export const COLORS = {
  navy: rgb(0.102, 0.243, 0.431),
  gold: rgb(0.788, 0.659, 0.298),
  paper: rgb(0.961, 0.945, 0.910),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  darkGray: rgb(0.25, 0.25, 0.25),
  mediumGray: rgb(0.5, 0.5, 0.5),
  lightGray: rgb(0.85, 0.85, 0.85),
  red: rgb(0.85, 0.15, 0.15),
  green: rgb(0.15, 0.65, 0.25),
  orange: rgb(0.95, 0.55, 0.1),
} as const

export const STATUS_COLORS: Record<string, typeof COLORS.navy> = {
  'On Track': COLORS.green,
  Compliant: COLORS.green,
  Completed: COLORS.green,
  Active: COLORS.green,
  'At Risk': COLORS.orange,
  'Due Soon': COLORS.orange,
  'In Progress': COLORS.orange,
  'Off Track': COLORS.red,
  'Non-Compliant': COLORS.red,
  Overdue: COLORS.red,
  Open: COLORS.red,
  Pending: COLORS.orange,
  Closed: COLORS.green,
  New: COLORS.red,
  Investigating: COLORS.orange,
  Escalated: COLORS.red,
}

export function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}

export function getStatusColor(status: string) {
  return STATUS_COLORS[status] || COLORS.mediumGray
}
