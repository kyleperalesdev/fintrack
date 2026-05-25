import { NavLink, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useDark } from '../ThemeContext'

const mainLinks = [
  { to: '/daily',        label: 'Daily',       shortLabel: 'Daily',   icon: '📅' },
  { to: '/breakdown',    label: 'Breakdown',   shortLabel: 'Break',   icon: '📊' },
  { to: '/history',      label: 'History',     shortLabel: 'History', icon: '📜' },
  { to: '/observations', label: 'Observations',shortLabel: 'Observe', icon: '🔍' },
]

const setupLinks = [
  { to: '/import',     label: 'Import',     icon: '📥' },
  { to: '/categories', label: 'Categories', icon: '🏷️' },
]

export default function Navigation() {
  const { dark, toggle } = useDark()
  const location = useLocation()
  const [setupOpen, setSetupOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (window.innerWidth < 768) return // mobile closing handled by backdrop
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSetupOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { setSetupOpen(false) }, [location.pathname])

  const isSetupActive = setupLinks.some(l => location.pathname === l.to)

  return (
    <>
      {/* Top bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">💰 FinTrack</span>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-1 items-center">
            {mainLinks.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                {icon} {label}
              </NavLink>
            ))}

            {/* Setup dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSetupOpen(o => !o)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  isSetupActive || setupOpen
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                ⚙️ Setup
                <svg
                  className={`w-3 h-3 transition-transform ${setupOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {setupOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                  {setupLinks.map(({ to, label, icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`
                      }
                    >
                      {icon} {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggle}
              className="ml-2 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={dark ? 'Switch to light mode' : 'Switch to night mode'}
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Mobile: dark mode toggle only */}
          <button
            onClick={toggle}
            className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={dark ? 'Switch to light mode' : 'Switch to night mode'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Mobile Setup slide-up panel — separate fixed element so hit-testing isn't clipped by the tab bar */}
      {setupOpen && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          {setupLinks.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSetupOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <span className="text-xl">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {setupOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setSetupOpen(false)}
        />
      )}

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex">
          {mainLinks.map(({ to, shortLabel, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-[10px] font-medium">{shortLabel}</span>
            </NavLink>
          ))}

          <button
            onClick={() => setSetupOpen(o => !o)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              isSetupActive || setupOpen
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">⚙️</span>
            <span className="text-[10px] font-medium">Setup</span>
          </button>
        </div>
      </div>
    </>
  )
}
