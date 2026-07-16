import { useEffect, useState } from 'react'

interface Props {
  raceName?: string
}

export default function Header({ raceName }: Props) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text)',
        }}>
          <span className="red" style={{ fontWeight: 700 }}>F1</span> COMPANION
        </span>
        {raceName && (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>·</span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 13,
              letterSpacing: '0.02em',
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
            }}>
              {raceName}
            </span>
          </>
        )}
      </div>
      <div className="data-mono" style={{
        fontSize: 12,
        color: 'var(--text-muted)',
      }}>
        {time} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>UTC</span>
      </div>
    </header>
  )
}
