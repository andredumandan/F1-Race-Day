import React from 'react'

export default function Header() {
  return (
    <header className="bg-f1-red text-white p-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">F1 Companion</h1>
      <div id="timezone-clock" />
    </header>
  )
}
