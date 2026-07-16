import useSWR from 'swr'
import DriverList, { SummaryDriver } from './DriverList'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error('Failed to fetch')
  const body = await r.json()
  if (body.error) throw new Error(body.error)
  return body
}

interface SummaryResponse {
  trackStatus: any
  recentRaceControlMessages: any[]
  drivers: SummaryDriver[]
}

interface Props {
  circuitName?: string
  round?: string
}

const TRACK_STATUS_LABELS: Record<string, string> = {
  '1': 'Track Clear',
  '2': 'Yellow Flag',
  '3': 'Safety Car',
  '4': 'Red Flag',
  '5': 'Virtual Safety Car',
  '6': 'Virtual Safety Car Ending',
}

const TRACK_STATUS_COLORS: Record<string, string> = {
  '1': 'var(--green)',
  '2': 'var(--amber)',
  '3': 'var(--amber)',
  '4': 'var(--red)',
  '5': 'var(--amber)',
  '6': 'var(--amber)',
}

function rcCategoryColor(category?: string): string {
  switch (category) {
    case 'Flag': return 'var(--red)'
    case 'SafetyCar': return 'var(--amber)'
    case 'CarEvent': return 'var(--cyan)'
    default: return 'var(--text-dim)'
  }
}

export default function LiveRaceView({ circuitName }: Props) {
  const { data, error, isValidating } = useSWR<SummaryResponse>(
    '/api/live',
    fetcher,
    { refreshInterval: 15000, revalidateOnFocus: false }
  )

  const drivers = data?.drivers ?? []
  const isLive = drivers.length > 0
  const trackStatus = data?.trackStatus
  const rcMessages = data?.recentRaceControlMessages ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="panel" style={{
        width: '100%',
        background: 'var(--bg)',
      }}>
        {isLive ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <span style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#00E676',
              animation: 'pulse-dot 1.5s ease-in-out infinite',
            }} />
            <span className="data-mono" style={{ fontSize: 11, fontWeight: 600 }}>
              LIVE
            </span>
            <span className="data-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {drivers.length} drivers
            </span>
            {circuitName && (
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                marginLeft: 'auto',
              }}>
                {circuitName}
              </span>
            )}
          </div>
        ) : (
          <div style={{
            padding: '16px 20px',
            textAlign: 'center',
            animation: 'fadeIn 0.4s ease-out',
          }}>
            <div className="label-group" style={{ fontSize: 12, marginBottom: 4 }}>
              Live Timing
            </div>
            <div className="data-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {error ? 'server unavailable' : isValidating ? 'connecting\u2026' : 'data appears when session is live'}
            </div>
          </div>
        )}
      </div>

      {isLive && trackStatus != null && (
        <div style={{
          padding: '6px 16px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'slideUp 0.3s ease-out',
        }}>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: TRACK_STATUS_COLORS[String(trackStatus)] ?? 'var(--text-muted)',
          }} />
          <span className="data-mono" style={{
            fontSize: 11,
            fontWeight: 600,
            color: TRACK_STATUS_COLORS[String(trackStatus)] ?? 'var(--text-dim)',
          }}>
            {TRACK_STATUS_LABELS[String(trackStatus)] ?? `Status ${trackStatus}`}
          </span>
        </div>
      )}

      {isLive && rcMessages.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: '8px 12px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          animation: 'slideUp 0.3s ease-out',
        }}>
          <div className="label-group" style={{ fontSize: 9, padding: '0 4px 4px', color: 'var(--text-muted)' }}>
            Race Control
          </div>
          {rcMessages.map((msg: any, i: number) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '4px 8px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.03)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-dim)',
                borderLeft: `2px solid ${rcCategoryColor(msg.Category)}`,
              }}
            >
              {msg.Category && (
                <span style={{
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: '0.04em',
                  color: rcCategoryColor(msg.Category),
                  whiteSpace: 'nowrap',
                  marginTop: 1,
                }}>
                  {msg.Category === 'Flag' ? (msg.Flag ?? 'FLAG') : msg.Category.toUpperCase()}
                </span>
              )}
              <span>{msg.Message ?? '(no message)'}</span>
            </div>
          ))}
        </div>
      )}

      {isLive && (
        <DriverList drivers={drivers} />
      )}
    </div>
  )
}
