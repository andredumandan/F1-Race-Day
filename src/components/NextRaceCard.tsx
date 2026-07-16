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
    setNextSession(findNextSession(race.sessions))
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
      <div className="panel" style={{ padding: 20, textAlign: 'center' }}>
        <span className="data-mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>loading…</span>
      </div>
    )
  }

  if (!race) {
    return (
      <div className="panel" style={{ padding: 20, textAlign: 'center' }}>
        <span className="label-group" style={{ fontSize: 12 }}>No upcoming race</span>
      </div>
    )
  }

  const days = Math.floor(remaining / 86400000)
  const hours = Math.floor((remaining % 86400000) / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div className="label-group" style={{ marginBottom: 14 }}>
        {nextSession ? `Next: ${sessionLabel(nextSession.session.label)}` : 'Season'}
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 24,
        lineHeight: 1.1,
        letterSpacing: '0.01em',
        textTransform: 'uppercase',
        color: 'var(--text)',
        marginBottom: 2,
      }}>
        {race.raceName}
      </div>
      <div className="dim" style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, marginBottom: 16 }}>
        {race.circuitName}
      </div>

      {nextSession ? (
        <>
          {remaining > 0 ? (
            <div style={{
              display: 'flex',
              gap: 4,
              fontFamily: 'var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: '0.02em',
              color: 'var(--amber)',
              marginBottom: 8,
            }}>
              <span>{String(days).padStart(2, '0')}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>d</span></span>
              <span style={{ color: 'var(--text-muted)' }}>:</span>
              <span>{String(hours).padStart(2, '0')}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>h</span></span>
              <span style={{ color: 'var(--text-muted)' }}>:</span>
              <span>{String(minutes).padStart(2, '0')}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>m</span></span>
              <span style={{ color: 'var(--text-muted)' }}>:</span>
              <span>{String(seconds).padStart(2, '0')}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>s</span></span>
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '0.04em',
              color: 'var(--red)',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              <span style={{ animation: 'amberPulse 1.5s ease-in-out infinite' }}>● Live</span>
            </div>
          )}
          <div className="data-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatLocalTime(nextSession.session.dateUtc!, 'EEE MMM d, p')}
          </div>
        </>
      ) : (
        <div className="data-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Season concluded
        </div>
      )}
    </div>
  )
}
