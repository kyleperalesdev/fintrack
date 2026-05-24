import { useState } from 'react'
import EntryForm from './EntryForm'

const fmt = (n) => `₱${parseFloat(n).toLocaleString('en', { minimumFractionDigits: 2 })}`

export default function EntryCard({ entry, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-700 p-4 shadow-sm">
        <EntryForm
          initial={entry}
          onSubmit={async (data) => { await onUpdate(entry.id, data); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  const isIncome = entry.type === 'income'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${
        isIncome
          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
          : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
      }`}>
        {isIncome ? '↑' : '↓'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{entry.category}</p>
        {entry.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{entry.description}</p>
        )}
      </div>
      <span className={`text-base font-semibold flex-shrink-0 ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isIncome ? '+' : '-'}{fmt(entry.amount)}
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
