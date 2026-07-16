import { useEffect, useState } from 'react'

export default function Header() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--red)',
      color: 'var(--white)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>F1 COMPANION</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        opacity: 0.85,
      }}>
        {time}
      </div>
    </header>
  )
}
