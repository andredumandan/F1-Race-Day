import { NextApiRequest, NextApiResponse } from 'next'

interface Session {
  label: string
  dateUtc: string | null
}

interface Race {
  season: string
  round: string
  raceName: string
  circuitName: string
  country: string
  location: string
  sessions: Session[]
}

interface CacheEntry {
  data: Race[]
  ts: number
}

const cache: Record<string, CacheEntry> = {}
const CACHE_TTL = 30 * 60 * 1000

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const cached = cache['calendar']
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.status(200).json(cached.data)
  }

  try {
    const response = await fetch('https://api.jolpi.ca/ergast/f1/current/races.json', {
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error(`Ergast responded ${response.status}`)
    const raw = await response.json()

    const races: Race[] = (raw.MRData?.RaceTable?.Races ?? []).map((r: any) => {
      const sessions: Session[] = []
      const addSession = (label: string, obj: any) => {
        if (obj?.date) {
          sessions.push({ label, dateUtc: `${obj.date}T${obj.time || '00:00:00Z'}` })
        }
      }
      addSession('Practice 1', r.FirstPractice)
      addSession('Practice 2', r.SecondPractice)
      addSession('Practice 3', r.ThirdPractice)
      addSession('Sprint Qualifying', r.SprintQualifying)
      addSession('Sprint', r.Sprint)
      addSession('Qualifying', r.Qualifying)
      addSession('Race', r.Race)

      return {
        season: r.season,
        round: r.round,
        raceName: r.raceName,
        circuitName: r.Circuit?.circuitName ?? '',
        country: r.Circuit?.Location?.country ?? '',
        location: r.Circuit?.Location?.locality ?? '',
        sessions,
      }
    })

    cache['calendar'] = { data: races, ts: Date.now() }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate')
    res.status(200).json(races)
  } catch (err) {
    const e = err as Error
    console.error('[/api/calendar]', e.message)
    res.status(500).json({ error: 'Failed to fetch calendar' })
  }
}
