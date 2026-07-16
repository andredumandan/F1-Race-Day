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
  // Find the next 5 that haven't happened yet
  const now = Date.now()
  const upcoming = races.filter(r => {
    // Check if any session is in the future
    return r.sessions.some(s => s.dateUtc && new Date(s.dateUtc).getTime() > now)
  }).slice(0, 5)

  if (upcoming.length === 0) return null

  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 11,
        color: 'var(--gray-600)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
      }}>
        Upcoming Races
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {upcoming.map(r => {
          // Find the race session date
          const raceSession = r.sessions.find(s => s.label === 'Race')
          const dateDisplay = raceSession?.dateUtc
            ? formatLocalTime(raceSession.dateUtc, 'MMM d, yyyy')
            : 'TBD'

          const isSelected = selectedRace === r.round
          const roundNum = parseInt(r.round, 10)

          return (
            <div
              key={r.round}
              onClick={() => onSelectRace?.(r.round)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                background: isSelected ? 'var(--gray-100)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)' }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--gray-100)',
                borderRadius: '50%',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                fontSize: 12,
                color: 'var(--gray-800)',
                flexShrink: 0,
              }}>
                {roundNum}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.raceName}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray-600)', marginTop: 1 }}>
                  {dateDisplay}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
