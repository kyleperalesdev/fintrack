import { NavLink } from 'react-router-dom'
import { useDark } from '../ThemeContext'

const links = [
  { to: '/daily',        label: 'Daily',        icon: '📅' },
  { to: '/breakdown',    label: 'Breakdown',    icon: '📊' },
  { to: '/history',      label: 'History',      icon: '📜' },
  { to: '/observations', label: 'Observations', icon: '🔍' },
  { to: '/import',       label: 'Import',       icon: '📥' },
]

export default function Navigation() {
  const { dark, toggle } = useDark()
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">💰 FinTrack</span>
        <div className="flex gap-1 items-center">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      </div>
    </nav>
  )
}
