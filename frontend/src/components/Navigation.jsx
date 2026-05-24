import { NavLink } from 'react-router-dom'
import { useDark } from '../ThemeContext'

const links = [
  { to: '/daily',        label: 'Daily',       shortLabel: 'Daily',   icon: '📅' },
  { to: '/breakdown',    label: 'Breakdown',   shortLabel: 'Break',   icon: '📊' },
  { to: '/history',      label: 'History',     shortLabel: 'History', icon: '📜' },
  { to: '/observations', label: 'Observations',shortLabel: 'Observe', icon: '🔍' },
  { to: '/import',       label: 'Import',      shortLabel: 'Import',  icon: '📥' },
]

export default function Navigation() {
  const { dark, toggle } = useDark()
  return (
    <>
      {/* Top bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">💰 FinTrack</span>

          {/* Desktop nav — hidden below md */}
          <div className="hidden md:flex gap-1 items-center">
            {links.map(({ to, label, icon }) => (
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

      {/* Mobile bottom tab bar — hidden at md and above */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex">
          {links.map(({ to, shortLabel, icon }) => (
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
        </div>
      </div>
    </>
  )
}
