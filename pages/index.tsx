import { useState, useMemo } from 'react'
import useSWR from 'swr'
import Head from 'next/head'
import Header from '../src/components/Header'
import NextRaceCard from '../src/components/NextRaceCard'
import UpcomingRaces from '../src/components/UpcomingRaces'
import LiveRaceView from '../src/components/LiveRaceView'

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

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error('Failed to fetch')
  const body = await r.json()
  if (body.error) throw new Error(body.error)
  return body
}

export default function Home() {
  const [selectedRound, setSelectedRound] = useState<string | null>(null)

  const { data: races } = useSWR<Race[]>('/api/calendar', fetcher, {
    refreshInterval: 30 * 60 * 1000,
    revalidateOnFocus: false,
  })

  const nextRace = useMemo<Race | null>(() => {
    if (!races) return null
    const now = Date.now()
    for (const r of races) {
      for (const s of r.sessions) {
        if (s.dateUtc && new Date(s.dateUtc).getTime() > now) {
          return r
        }
      }
    }
    return races[races.length - 1] ?? null
  }, [races])

  const liveRace = selectedRound
    ? races?.find(r => r.round === selectedRound)
    : nextRace

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>F1 Companion</title>
        <meta name="description" content="Live F1 companion" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏎️</text></svg>" />
      </Head>

      <Header raceName={liveRace?.raceName} />

      <main style={{
        flex: 1,
        display: 'flex',
        gap: 0,
        width: '100%',
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: 0,
      }} className="layout-sidebar">
        {/* Sidebar */}
        <aside className="sidebar" style={{
          width: 'var(--sidebar-width)',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}>
          <div style={{ padding: 16 }}>
            <NextRaceCard race={nextRace} loading={!races} />
          </div>

          {races && races.length > 0 && (
            <UpcomingRaces
              races={races}
              selectedRace={selectedRound}
              onSelectRace={setSelectedRound}
            />
          )}
        </aside>

        {/* Main content */}
        <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <LiveRaceView circuitName={liveRace?.circuitName} round={liveRace?.round} />
        </section>
      </main>

      <style>{`
        @media (max-width: 800px) {
          .layout-sidebar {
            flex-direction: column;
          }
          .sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border);
          }
        }
      `}</style>
    </div>
  )
}
