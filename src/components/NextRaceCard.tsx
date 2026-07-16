import { useEffect, useState } from 'react'
import { formatLocalTime, sessionLabel } from '../lib/timezone'

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

interface Props {
  race?: Race | null
  loading?: boolean
}

function findNextSession(sessions: Session[]): { session: Session; ms: number } | null {
  const now = Date.now()
  for (const s of sessions) {
    if (!s.dateUtc) continue
    const ms = new Date(s.dateUtc).getTime()
    if (ms > now) return { session: s, ms }
  }
  return null
}

export default function NextRaceCard({ race, loading }: Props) {
  const [nextSession, setNextSession] = useState<{ session: Session; ms: number } | null>(null)
  const [remaining, setRemaining] = useState<number>(0)

  useEffect(() => {
    if (!race) return
    const ns = findNextSession(race.sessions)
    setNextSession(ns)
  }, [race])

  useEffect(() => {
    if (!nextSession) return
    const tick = () => {
      setRemaining(Math.max(0, nextSession.ms - Date.now()))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [nextSession])

  if (loading) {
    return (
      <div className="card" style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
        Loading…
      </div>
    )
  }

  if (!race) {
    return (
      <div className="card" style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
        No upcoming race
      </div>
    )
  }

  const days = Math.floor(remaining / 86400000)
  const hours = Math.floor((remaining % 86400000) / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return (
    <div className="card">
      {/* Race header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--gray-900)' }}>
            {race.raceName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>
            {race.circuitName} &middot; {race.location}, {race.country}
          </div>
        </div>
        {nextSession && (
          <div style={{
            background: 'var(--red)',
            color: 'var(--white)',
            padding: '2px 8px',
            borderRadius: 'var(--border-radius)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 12,
          }}>
            {sessionLabel(nextSession.session.label)}
          </div>
        )}
      </div>

      {/* Countdown */}
      {nextSession ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 32, letterSpacing: 2 }}>
            {remaining > 0 ? (
              <>
                {String(days).padStart(2, '0')}<span style={{ color: 'var(--gray-400)', fontSize: 16 }}>d</span>
                {' '}
                {String(hours).padStart(2, '0')}<span style={{ color: 'var(--gray-400)', fontSize: 16 }}>h</span>
                {' '}
                {String(minutes).padStart(2, '0')}<span style={{ color: 'var(--gray-400)', fontSize: 16 }}>m</span>
                {' '}
                {String(seconds).padStart(2, '0')}<span style={{ color: 'var(--gray-400)', fontSize: 16 }}>s</span>
              </>
            ) : 'LIVE'}
          </div>
          {remaining > 0 && nextSession.session.dateUtc && (
            <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4 }}>
              {formatLocalTime(nextSession.session.dateUtc, 'EEE MMM d, p')}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 8, color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
          Season concluded
        </div>
      )}
    </div>
  )
}
