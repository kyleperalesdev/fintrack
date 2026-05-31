import { useState, useEffect, useCallback } from 'react'
import EntryForm from '../components/EntryForm'
import EntryCard from '../components/EntryCard'
import { getEntries, createEntry, updateEntry, deleteEntry } from '../api'

const fmt = (n) => `₱${Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2 })}`

const dateCls = 'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:[color-scheme:dark]'

export default function Daily() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getEntries({ date })
    setEntries(data)
    setLoading(false)
  }, [date])

  useEffect(() => { load() }, [load])

  const income  = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const net     = income - expense

  const handleCreate = async (data) => {
    await createEntry(data)
    setShowForm(false)
    load()
  }
  const handleUpdate = async (id, data) => { await updateEntry(id, data); load() }
  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    await deleteEntry(id); load()
  }

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daily Entries</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={dateCls}
          />
          <button
            onClick={() => setShowForm(f => !f)}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 whitespace-nowrap"
          >
            {showForm ? 'Cancel' : '+ Add Entry'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Income</p>
          <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400 mt-1 truncate">{fmt(income)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">Expenses</p>
          <p className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-400 mt-1 truncate">{fmt(expense)}</p>
        </div>
        <div className={`border rounded-xl p-3 sm:p-4 ${
          net >= 0
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
        }`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Net</p>
          <p className={`text-lg sm:text-2xl font-bold mt-1 truncate ${net >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
            {net < 0 ? '-' : ''}{fmt(net)}
          </p>
        </div>
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-700 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">New Entry for {dateLabel}</h2>
          <EntryForm initial={{ date }} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Entries */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">Loading...</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-2">📝</p>
            <p className="text-sm">No entries for this day. Add one above!</p>
          </div>
        ) : (
          entries.map(e => (
            <EntryCard key={e.id} entry={e} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  )
}
