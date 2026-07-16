import { toZonedTime, format } from 'date-fns-tz'

let cachedTimezone: string | null = null

export function detectTimezone(): string {
  if (cachedTimezone) return cachedTimezone
  try {
    cachedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    cachedTimezone = 'UTC'
  }
  return cachedTimezone
}

export function formatLocalTime(utcIso: string, fmt: string = 'MMM d, p'): string {
  const tz = detectTimezone()
    const zoned = toZonedTime(new Date(utcIso), tz)
  return format(zoned, fmt, { timeZone: tz })
}

export function sessionLabel(label: string): string {
  const map: Record<string, string> = {
    'Practice 1': 'FP1',
    'Practice 2': 'FP2',
    'Practice 3': 'FP3',
    'Sprint Qualifying': 'Sprint Quali',
    'Sprint': 'Sprint',
    'Qualifying': 'Quali',
    'Race': 'Race',
  }
  return map[label] || label
}
