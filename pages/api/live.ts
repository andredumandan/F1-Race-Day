import { NextApiRequest, NextApiResponse } from 'next'

export interface SummaryDriver {
  carNumber: string
  tla: string | null
  fullName: string | null
  team: string | null
  position: number | null
  gapToLeader: string | null
  intervalToAhead: string | null
  lastLapTime: string | null
  inPit: boolean | null
  pitCount: number | null
  retired: boolean | null
  compound: string | null
  stintLaps: number | null
}

interface SummaryResponse {
  trackStatus: any
  recentRaceControlMessages: any[]
  drivers: SummaryDriver[]
}

interface CacheEntry {
  data: SummaryResponse
  ts: number
}

const cache: Record<string, CacheEntry> = {}
const CACHE_TTL = 5000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cached = cache['summary']
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.status(200).json(cached.data)
  }

  try {
    const fastf1Url = process.env.FASTF1_URL
    if (!fastf1Url) throw new Error('FASTF1_URL not set')

    const response = await fetch(`${fastf1Url}/summary`, { signal: AbortSignal.timeout(8000) })

    if (!response.ok) {
      if (response.status === 503) {
        const empty: SummaryResponse = {
          trackStatus: null,
          recentRaceControlMessages: [],
          drivers: [],
        }
        return res.status(200).json(empty)
      }
      throw new Error(`FastF1 responded ${response.status}`)
    }

    const data: SummaryResponse = await response.json()

    cache['summary'] = { data, ts: Date.now() }

    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate')
    res.status(200).json(data)
  } catch (e: unknown) {
    const err = e as Error
    console.error('[/api/live]', err.message)
    res.status(502).json({ error: 'Live data unavailable' })
  }
}
