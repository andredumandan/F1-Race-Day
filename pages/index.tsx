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

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Home() {
  const [selectedRound, setSelectedRound] = useState<string | null>(null)

  const { data: races } = useSWR<Race[]>('/api/calendar', fetcher, {
    refreshInterval: 30 * 60 * 1000,
    revalidateOnFocus: false,
  })

  // Find the next race (the one with the nearest future session)
  const nextRace = useMemo<Race | null>(() => {
    if (!races) return null
    const now = Date.now()
    // Find the first race with a future session
    for (const r of races) {
      for (const s of r.sessions) {
        if (s.dateUtc && new Date(s.dateUtc).getTime() > now) {
          return r
        }
      }
    }
    return races[races.length - 1] ?? null // fall back to last race
  }, [races])

  // Determine which race to show in the live view
  const liveRace = selectedRound
    ? races?.find(r => r.round === selectedRound)
    : nextRace

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>F1 Companion</title>
        <meta name="description" content="Live F1 companion app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏎️</text></svg>" />
      </Head>

      <Header />

      <main style={{
        flex: 1,
        display: 'flex',
        gap: 16,
        padding: 16,
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        width: '100%',
      }} className="layout-sidebar">
        {/* Sidebar – mobile: top, desktop: left */}
        <aside style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }} className="sidebar">
          <NextRaceCard race={nextRace} loading={!races} />

          {races && races.length > 0 && (
            <UpcomingRaces
              races={races}
              selectedRace={selectedRound}
              onSelectRace={setSelectedRound}
            />
          )}
        </aside>

        {/* Main – mobile: bottom, desktop: right */}
        <section style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {liveRace ? `${liveRace.raceName}` : 'Live'}
            </div>
          </div>
          <LiveRaceView circuitName={liveRace?.circuitName} round={liveRace?.round} />
        </section>
      </main>

      <style>{`
        @media (max-width: 600px) {
          .layout-sidebar {
            flex-direction: column;
          }
          .sidebar {
            width: 100% !important;
          }
        }
        @media (min-width: 601px) {
          .sidebar {
            width: var(--sidebar-width);
            flex-shrink: 0;
          }
        }
      `}</style>
    </div>
  )
}
