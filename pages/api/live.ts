import { NextApiRequest, NextApiResponse } from 'next'

interface Driver {
  driverNumber: number
  position?: number
  gapToLeader?: string | number | null
  laps?: number
  speedKmh?: number
  x?: number
  y?: number
}

interface CacheEntry {
  data: Driver[]
  ts: number
}

const cache: Record<string, CacheEntry> = {}
const CACHE_TTL = 5000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cached = cache['live']
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.status(200).json(cached.data)
  }

  try {
    const fastf1Url = process.env.FASTF1_URL
    if (!fastf1Url) throw new Error('FASTF1_URL not set')

    const response = await fetch(`${fastf1Url}/live`, { signal: AbortSignal.timeout(8000) })

    if (!response.ok) {
      if (response.status === 503) {
        return res.status(200).json([])
      }
      throw new Error(`FastF1 responded ${response.status}`)
    }

    const raw: Record<string, any> = await response.json()

    const drivers: Driver[] = []

    // Parse TimingData → position / gap / laps
    const timing = raw['TimingData']?.data
    if (timing?.Lines) {
      for (const [numStr, line] of Object.entries(timing.Lines) as [string, any][]) {
        const num = parseInt(numStr, 10)
        let existing = drivers.find(d => d.driverNumber === num)
        if (!existing) {
          existing = { driverNumber: num }
          drivers.push(existing)
        }
        existing.position = line.Position
        existing.gapToLeader = line.GapToLeader ?? line.Gap
        existing.laps = line.NumberOfLaps
      }
    }

    // Parse CarData.z → speed
    const carData = raw['CarData.z']?.data
    if (carData && typeof carData === 'object') {
      for (const [numStr, entry] of Object.entries(carData) as [string, any][]) {
        const num = parseInt(numStr, 10)
        let existing = drivers.find(d => d.driverNumber === num)
        if (!existing) {
          existing = { driverNumber: num }
          drivers.push(existing)
        }
        existing.speedKmh = entry.speed ?? entry.Speed
      }
    }

    // Parse Position.z → x/y
    const posData = raw['Position.z']?.data
    if (posData && typeof posData === 'object') {
      for (const [numStr, entry] of Object.entries(posData) as [string, any][]) {
        // Position.z is sometimes an array of entries per car, take the latest
        const carEntry = Array.isArray(entry) ? entry[entry.length - 1] : entry
        if (!carEntry) continue
        const num = parseInt(numStr, 10)
        let existing = drivers.find(d => d.driverNumber === num)
        if (!existing) {
          existing = { driverNumber: num }
          drivers.push(existing)
        }
        existing.x = carEntry.x ?? carEntry.X
        existing.y = carEntry.y ?? carEntry.Y
      }
    }

    // Sort by position
    drivers.sort((a, b) => (a.position ?? 999) - (b.position ?? 999))

    cache['live'] = { data: drivers, ts: Date.now() }

    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate')
    res.status(200).json(drivers)
  } catch (e: unknown) {
    const err = e as Error
    console.error('[/api/live]', err.message)
    res.status(502).json({ error: 'Live data unavailable' })
  }
}
