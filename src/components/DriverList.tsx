export interface Driver {
  driverNumber: number
  position?: number
  gapToLeader?: string | number | null
  laps?: number
  speedKmh?: number
  x?: number
  y?: number
}

interface Props {
  drivers: Driver[]
}

const TEAM_NUMBERS: Record<number, string> = {
  1: 'redbull', 11: 'redbull', 16: 'ferrari', 55: 'ferrari',
  63: 'mercedes', 44: 'mercedes', 4: 'mclaren', 81: 'mclaren',
  14: 'aston_martin', 18: 'aston_martin', 10: 'alpine', 31: 'alpine',
  23: 'williams', 2: 'williams', 27: 'haas', 20: 'haas',
  22: 'vcarb', 3: 'vcarb', 5: 'sauber', 24: 'sauber',
}

function teamName(num: number): string {
  return TEAM_NUMBERS[num] || 'unknown'
}

export default function DriverList({ drivers }: Props) {
  if (drivers.length === 0) return null

  const sorted = [...drivers].sort((a, b) => (a.position ?? 999) - (b.position ?? 999))

  return (
    <div className="panel" style={{ borderTop: 'none', overflow: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontVariantNumeric: 'tabular-nums',
      }}>
        <thead>
          <tr className="label-group" style={{
            fontSize: 10,
            borderBottom: '1px solid var(--border)',
          }}>
            <td style={{ padding: '10px 12px', width: 32, textAlign: 'center' }}>#</td>
            <td style={{ padding: '10px 12px' }}>Driver</td>
            <td style={{ padding: '10px 12px', textAlign: 'right' }}>Gap</td>
            <td style={{ padding: '10px 12px', textAlign: 'right' }}>Laps</td>
            <td style={{ padding: '10px 12px', textAlign: 'right' }}>Speed</td>
          </tr>
        </thead>
        <tbody>
          {sorted.map(d => {
            const isLeader = d.position === 1
            return (
              <tr
                key={d.driverNumber}
                style={{
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.1s',
                  animation: 'fadeIn 0.2s ease-out',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <td style={{
                  padding: '10px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 15,
                  textAlign: 'center',
                  color: isLeader ? 'var(--amber)' : 'var(--text)',
                  width: 32,
                }}>
                  {d.position ?? '-'}
                </td>
                <td style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <img
                    src={`/logos/${teamName(d.driverNumber)}.svg`}
                    alt=""
                    style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0, opacity: 0.8 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="data-mono" style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: isLeader ? 'var(--amber)' : 'var(--text)',
                  }}>
                    {d.driverNumber}
                  </span>
                </td>
                <td className="data-mono" style={{
                  padding: '10px 12px',
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 500,
                  color: isLeader ? 'var(--amber)' : (
                    d.gapToLeader != null && d.gapToLeader !== 'LEADER'
                      ? 'var(--text)'
                      : 'var(--text-muted)'
                  ),
                }}>
                  {d.gapToLeader != null
                    ? typeof d.gapToLeader === 'number'
                      ? `+${d.gapToLeader.toFixed(3)}`
                      : String(d.gapToLeader)
                    : d.position === 1 ? 'LEADER' : '-'}
                </td>
                <td className="data-mono" style={{
                  padding: '10px 12px',
                  textAlign: 'right',
                  fontSize: 13,
                  color: 'var(--text-dim)',
                }}>
                  {d.laps ?? '-'}
                </td>
                <td className="data-mono" style={{
                  padding: '10px 12px',
                  textAlign: 'right',
                  fontSize: 13,
                  color: d.speedKmh ? 'var(--cyan)' : 'var(--text-muted)',
                }}>
                  {d.speedKmh != null ? `${d.speedKmh}` : '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
