import { formatLocalTime } from '../lib/timezone'

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
  races: Race[]
  selectedRace?: string | null
  onSelectRace?: (round: string) => void
}

export default function UpcomingRaces({ races, selectedRace, onSelectRace }: Props) {
  const now = Date.now()
  const upcoming = races.filter(r =>
    r.sessions.some(s => s.dateUtc && new Date(s.dateUtc).getTime() > now)
  ).slice(0, 5)

  if (upcoming.length === 0) return null

  const roundNum = (r: Race) => parseInt(r.round, 10)

  return (
    <div className="panel" style={{ padding: '16px 0' }}>
      <div className="label-group" style={{ padding: '0 20px', marginBottom: 10 }}>
        Calendar
      </div>

      {upcoming.map((r, i) => {
        const isSelected = selectedRace === r.round
        const raceSession = r.sessions.find(s => s.label === 'Race')
        const dateDisplay = raceSession?.dateUtc
          ? formatLocalTime(raceSession.dateUtc, 'MMM d')
          : null

        return (
          <div
            key={r.round}
            onClick={() => onSelectRace?.(r.round)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') onSelectRace?.(r.round) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 20px',
              cursor: 'pointer',
              borderLeft: isSelected ? '2px solid var(--amber)' : '2px solid transparent',
              background: isSelected ? 'var(--surface-hover)' : 'transparent',
              transition: 'background 0.1s, border-color 0.1s',
              userSelect: 'none',
            }}
            onMouseEnter={e => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'
            }}
            onMouseLeave={e => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <span className="data-mono" style={{
              fontSize: 11,
              fontWeight: 500,
              color: isSelected ? 'var(--amber)' : 'var(--text-muted)',
              minWidth: 20,
            }}>
              {String(roundNum(r)).padStart(2, '0')}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.01em',
                textTransform: 'uppercase',
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {r.raceName}
              </div>
              <div className="data-mono" style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginTop: 1,
              }}>
                {r.circuitName}
              </div>
            </div>
            {dateDisplay && (
              <div className="data-mono" style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {dateDisplay}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
