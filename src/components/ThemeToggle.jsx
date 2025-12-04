// src/ui/ThemeToggle.jsx
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-indigo-50 transition-colors text-sm"
    >
      {dark ? 'Dark' : 'Light'}
    </button>
  )
}
