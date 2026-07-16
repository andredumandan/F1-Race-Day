import useSWR from 'swr'
import DriverList, { Driver } from './DriverList'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const TRACK_SVGS: Record<string, string> = {
  'Abu Dhabi': 'abu_dhabi',
  'Albert Park Grand Prix Circuit': 'melbourne',
  'Autódromo José Carlos Pace': 'interlagos',
  'Autodromo Nazionale di Monza': 'monza',
  'Autódromo Hermanos Rodríguez': 'mexico_city',
  'Baku City Circuit': 'baku',
  'Circuit de Barcelona-Catalunya': 'barcelona',
  'Circuit de Monaco': 'monaco',
  'Circuit de Spa-Francorchamps': 'spa',
  'Circuit Gilles Villeneuve': 'montreal',
  'Circuit of the Americas': 'cota',
  'Circuit Park Zandvoort': 'zandvoort',
  'Hungaroring': 'budapest',
  'Las Vegas Strip Street Circuit': 'las_vegas',
  'Losail International Circuit': 'losail',
  'Marina Bay Street Circuit': 'singapore',
  'Miami International Autodrome': 'miami',
  'Red Bull Ring': 'spielberg',
  'Shanghai International Circuit': 'shanghai',
  'Silverstone Circuit': 'silverstone',
  'Suzuka Circuit': 'suzuka',
  'Yas Marina Circuit': 'abu_dhabi',
}

interface Props {
  circuitName?: string
  round?: string
}

export default function LiveRaceView({ circuitName, round }: Props) {
  const { data: drivers, error, isValidating } = useSWR<Driver[]>(
    `/api/live`,
    fetcher,
    { refreshInterval: 15000, revalidateOnFocus: false }
  )

  const svgKey = circuitName ? (TRACK_SVGS[circuitName] || circuitName.toLowerCase().replace(/[^a-z0-9]/g, '_')) : null
  const svgUrl = svgKey ? `/track/${svgKey}.svg` : null

  const isLive = drivers && drivers.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Track map hero */}
      <div className="panel" style={{
        position: 'relative',
        width: '100%',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}>
        {!isLive && !error && !isValidating && (
          <div style={{
            padding: 40,
            textAlign: 'center',
            animation: 'fadeIn 0.4s ease-out',
          }}>
            <div className="label-group" style={{ fontSize: 12, marginBottom: 8 }}>
              Track View
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 18,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: 'var(--text-dim)',
              marginBottom: 6,
            }}>
              {circuitName || 'No circuit selected'}
            </div>
            <div className="data-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {error ? 'server unavailable' : 'data appears when session is live'}
            </div>
          </div>
        )}

        {isValidating && !drivers && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="data-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              connecting…
            </div>
          </div>
        )}

        {isLive && (
          <>
            {/* Live indicator */}
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 10,
            }}>
              <span style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#00E676',
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }} />
              <span className="data-mono" style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>
                LIVE
              </span>
              <span className="data-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {drivers.length} drivers
              </span>
            </div>

            <TrackMap svgUrl={svgUrl} drivers={drivers} />
          </>
        )}
      </div>

      {/* Driver timing grid */}
      {isLive && (
        <DriverList drivers={drivers} />
      )}
    </div>
  )
}

function TrackMap({ svgUrl, drivers }: { svgUrl: string | null; drivers: Driver[] }) {
  const hasPositions = drivers.some(d => d.x != null && d.y != null)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  if (hasPositions) {
    for (const d of drivers) {
      if (d.x != null && d.y != null) {
        if (d.x < minX) minX = d.x
        if (d.x > maxX) maxX = d.x
        if (d.y < minY) minY = d.y
        if (d.y > maxY) maxY = d.y
      }
    }
  }
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const PADDING = 40
  const SVG_W = 500
  const SVG_H = 300

  // Find the leader (driver with position 1)
  const leader = hasPositions ? drivers.find(d => d.position === 1)?.driverNumber : null

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height="100%" style={{
      display: 'block',
      minHeight: 200,
      animation: 'fadeIn 0.5s ease-out',
    }}>
      {svgUrl && (
        <image
          href={svgUrl}
          x="0" y="0"
          width={SVG_W}
          height={SVG_H}
          preserveAspectRatio="xMidYMid meet"
          opacity={0.15}
        />
      )}

      {hasPositions && drivers.map(d => {
        if (d.x == null || d.y == null) return null
        const px = PADDING + ((d.x - minX) / rangeX) * (SVG_W - 2 * PADDING)
        const py = PADDING + ((d.y - minY) / rangeY) * (SVG_H - 2 * PADDING)
        const isLeader = d.driverNumber === leader

        return (
          <g key={d.driverNumber}>
            <circle
              cx={px} cy={py}
              r={isLeader ? 8 : 5}
              fill={isLeader ? 'var(--amber)' : 'var(--cyan)'}
              stroke={isLeader ? 'var(--amber)' : 'var(--cyan)'}
              strokeWidth={isLeader ? 2 : 0}
              opacity={isLeader ? 1 : 0.7}
              style={isLeader ? { animation: 'pulse-dot 2s ease-in-out infinite' } : undefined}
            />
            <circle
              cx={px} cy={py}
              r={isLeader ? 14 : 10}
              fill="none"
              stroke={isLeader ? 'var(--amber)' : 'var(--cyan)'}
              strokeWidth={1}
              opacity={0.2}
            />
            <text
              x={px} y={py - (isLeader ? 16 : 12)}
              textAnchor="middle"
              fill={isLeader ? 'var(--amber)' : 'var(--text-dim)'}
              fontFamily="var(--font-mono)"
              fontWeight={600}
              fontSize={10}
            >
              {d.position}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
