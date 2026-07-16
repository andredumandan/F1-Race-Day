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

interface Props {
  drivers: SummaryDriver[]
}

const TEAM_NUMBERS: Record<number, string> = {
  1: 'redbull', 11: 'redbull', 16: 'ferrari', 55: 'ferrari',
  63: 'mercedes', 44: 'mercedes', 4: 'mclaren', 81: 'mclaren',
  14: 'aston_martin', 18: 'aston_martin', 10: 'alpine', 31: 'alpine',
  23: 'williams', 2: 'williams', 27: 'haas', 20: 'haas',
  22: 'vcarb', 3: 'vcarb', 5: 'sauber', 24: 'sauber',
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#DA291C',
  MEDIUM: '#F5A623',
  HARD: '#FFFFFF',
  INTERMEDIATE: '#00E676',
  WET: '#4A90D9',
}

function teamLogo(num: string): string {
  return `/logos/${TEAM_NUMBERS[parseInt(num, 10)] || 'unknown'}.svg`
}

export default function DriverList({ drivers }: Props) {
  if (drivers.length === 0) return null

  const sorted = [...drivers].sort((a, b) => (a.position ?? 999) - (b.position ?? 999))

  return (
    <div className="panel" style={{ borderTop: 'none', overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontVariantNumeric: 'tabular-nums',
        minWidth: 640,
      }}>
        <thead>
          <tr className="label-group" style={{
            fontSize: 10,
            borderBottom: '1px solid var(--border)',
          }}>
            <td style={{ padding: '10px 8px', width: 28, textAlign: 'center' }}>#</td>
            <td style={{ padding: '10px 8px' }}>Driver</td>
            <td style={{ padding: '10px 8px', textAlign: 'right' }}>Gap</td>
            <td style={{ padding: '10px 8px', textAlign: 'right' }}>Interval</td>
            <td style={{ padding: '10px 8px', textAlign: 'right' }}>Last Lap</td>
            <td style={{ padding: '10px 8px', textAlign: 'center' }}>Tyre</td>
            <td style={{ padding: '10px 8px', textAlign: 'center' }}>Stint</td>
            <td style={{ padding: '10px 8px', textAlign: 'center', width: 44 }}>Status</td>
          </tr>
        </thead>
        <tbody>
          {sorted.map(d => {
            const isLeader = d.position === 1
            const isRetired = d.retired === true
            const isInPit = d.inPit === true
            const compoundKey = d.compound?.toUpperCase() ?? ''
            const compoundColor = COMPOUND_COLORS[compoundKey] ?? null

            return (
              <tr
                key={d.carNumber}
                style={{
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.1s',
                  animation: 'fadeIn 0.2s ease-out',
                  opacity: isRetired ? 0.4 : 1,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <td style={{
                  padding: '10px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 15,
                  textAlign: 'center',
                  color: isLeader ? 'var(--amber)' : 'var(--text)',
                }}>
                  {d.position ?? '-'}
                </td>
                <td style={{
                  padding: '10px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <img
                    src={teamLogo(d.carNumber)}
                    alt=""
                    style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0, opacity: 0.8 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    fontSize: 14,
                    color: isLeader ? 'var(--amber)' : 'var(--text)',
                  }}>
                    {d.carNumber}
                  </span>
                  {d.tla && (
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: 12,
                      color: 'var(--text-dim)',
                      letterSpacing: '0.04em',
                    }}>
                      {d.tla}
                    </span>
                  )}
                </td>
                <td className="data-mono" style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 500,
                  color: isLeader ? 'var(--amber)' : (
                    d.gapToLeader && d.gapToLeader !== 'LEADER'
                      ? 'var(--text)' : 'var(--text-muted)'
                  ),
                }}>
                  {isRetired ? '-' : (
                    d.position === 1 ? 'LEADER' : (d.gapToLeader != null ? String(d.gapToLeader) : '-')
                  )}
                </td>
                <td className="data-mono" style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  fontSize: 13,
                  color: d.intervalToAhead ? 'var(--text-dim)' : 'var(--text-muted)',
                }}>
                  {isRetired ? '-' : (d.intervalToAhead ?? '-')}
                </td>
                <td className="data-mono" style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  fontSize: 13,
                  color: d.lastLapTime ? 'var(--cyan)' : 'var(--text-muted)',
                }}>
                  {isRetired ? '-' : (d.lastLapTime ?? '-')}
                </td>
                <td style={{
                  padding: '10px 8px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {d.compound && !isRetired ? (
                    <span style={{ color: compoundColor ?? 'var(--text-muted)' }}>
                      ● {d.compound.substring(0, 4)}
                    </span>
                  ) : '-'}
                </td>
                <td className="data-mono" style={{
                  padding: '10px 8px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: d.stintLaps != null ? 'var(--text-dim)' : 'var(--text-muted)',
                }}>
                  {!isRetired && d.stintLaps != null ? d.stintLaps : '-'}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  {isInPit && !isRetired && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'var(--amber)',
                      letterSpacing: '0.08em',
                    }}>
                      PIT
                    </span>
                  )}
                  {isRetired && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'var(--red)',
                      letterSpacing: '0.08em',
                    }}>
                      OUT
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
