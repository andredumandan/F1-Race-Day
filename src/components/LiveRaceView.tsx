import useSWR from 'swr'
import DriverList, { Driver } from './DriverList'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const TRACK_SVGS: Record<string, string> = {
  'Abu Dhabi': 'abu_dhabi',
  'Baku': 'baku',
  'Bahrain': 'bahrain',
  'Barcelona': 'barcelona',
  'Budapest': 'budapest',
  'Cota': 'cota',
  'Doha': 'losail',
  'Imola': 'imola',
  'Interlagos': 'interlagos',
  'Jeddah': 'jeddah',
  'Las Vegas': 'las_vegas',
  'Lusail': 'losail',
  'Marina Bay': 'singapore',
  'Melbourne': 'melbourne',
  'Mexico City': 'mexico_city',
  'Miami': 'miami',
  'Monaco': 'monaco',
  'Montreal': 'montreal',
  'Monza': 'monza',
  'Mugello': 'mugello',
  'Nürburgring': 'nurburgring',
  'Portimão': 'portimao',
  'Red Bull Ring': 'spielberg',
  'Sakhir': 'bahrain',
  'Sao Paulo': 'interlagos',
  'Shanghai': 'shanghai',
  'Silverstone': 'silverstone',
  'Singapore': 'singapore',
  'Sochi': 'sochi',
  'Spa-Francorchamps': 'spa',
  'Suzuka': 'suzuka',
  'Zandvoort': 'zandvoort',
  'Zeltweg': 'spielberg',
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

  const svgKey = circuitName ? TRACK_SVGS[circuitName] || circuitName.toLowerCase().replace(/[^a-z0-9]/g, '_') : null
  const svgUrl = svgKey ? `/track/${svgKey}.svg` : null

  const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  if (error) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'var(--gray-400)' }}>
        Server unavailable. Check back during a live session.
      </div>
    )
  }

  if (!drivers && isValidating) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'var(--gray-400)' }}>
        Connecting…
      </div>
    )
  }

  if (drivers && drivers.length === 0) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'var(--gray-400)' }}>
        No live session right now
      </div>
    )
  }

  if (!drivers) return null

  // Compute bounding box for positions
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
  const SVG_W = 300
  const SVG_H = 200

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Track / Position overlay */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, margin: '0 auto', aspectRatio: '3 / 2', background: 'var(--gray-50)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height="100%" style={{ display: 'block' }}>
          {/* If we have a circuit SVG, draw it behind */}
          {svgUrl ? (
            <image href={svgUrl} x="0" y="0" width={SVG_W} height={SVG_H} preserveAspectRatio="xMidYMid meet" opacity={0.2} />
          ) : null}

          {/* Driver dots */}
          {hasPositions && drivers.map(d => {
            if (d.x == null || d.y == null) return null
            const px = PADDING + ((d.x - minX) / rangeX) * (SVG_W - 2 * PADDING)
            const py = PADDING + ((d.y - minY) / rangeY) * (SVG_H - 2 * PADDING)

            return (
              <g key={d.driverNumber}>
                <circle cx={px} cy={py} r={6} fill="var(--red)" stroke="var(--white)" strokeWidth={2} />
                <text
                  x={px} y={py - 10}
                  textAnchor="middle"
                  fill="var(--gray-900)"
                  fontFamily="var(--font-mono)"
                  fontWeight={600}
                  fontSize={8}
                >
                  {d.position}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Driver table */}
      <DriverList drivers={drivers} />
    </div>
  )
}
