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

  return (
    <div style={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 11,
            color: 'var(--gray-600)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            borderBottom: '1px solid var(--gray-100)',
          }}>
            <td style={{ padding: '6px 8px', width: 32 }}>#</td>
            <td style={{ padding: '6px 8px' }}>Driver</td>
            <td style={{ padding: '6px 8px', textAlign: 'right' }}>Gap</td>
            <td style={{ padding: '6px 8px', textAlign: 'right' }}>Laps</td>
            <td style={{ padding: '6px 8px', textAlign: 'right' }}>Speed</td>
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => (
            <tr
              key={d.driverNumber}
              style={{
                borderBottom: '1px solid var(--gray-50)',
                transition: 'background 0.15s',
              }}
            >
              <td style={{
                padding: '8px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--gray-900)',
                textAlign: 'center',
                width: 32,
              }}>
                {d.position ?? '-'}
              </td>
              <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={`/logos/${teamName(d.driverNumber)}.svg`}
                  alt=""
                  style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>
                  {d.driverNumber}
                </span>
              </td>
              <td style={{
                padding: '8px',
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: typeof d.gapToLeader === 'number' && d.gapToLeader > 0 ? 'var(--gray-800)' : 'var(--gray-400)',
              }}>
                {d.gapToLeader != null
                  ? typeof d.gapToLeader === 'number'
                    ? d.gapToLeader.toFixed(3)
                    : String(d.gapToLeader)
                  : '-'}
              </td>
              <td style={{
                padding: '8px',
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: 'var(--gray-600)',
              }}>
                {d.laps ?? '-'}
              </td>
              <td style={{
                padding: '8px',
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: d.speedKmh ? 'var(--gray-800)' : 'var(--gray-400)',
              }}>
                {d.speedKmh != null ? `${d.speedKmh} km/h` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
