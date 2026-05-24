import { useState, useEffect, useCallback } from 'react'
import EntryCard from '../components/EntryCard'
import { getEntries, updateEntry, deleteEntry } from '../api'

const fmt = (n) => `₱${Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2 })}`
const dateCls = 'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:[color-scheme:dark]'

const currentMonth = () => {
  const d = new Date()
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, d.getMonth() + 1, 0).getDate()
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, '0')}` }
}

export default function History() {
  const [range, setRange] = useState(currentMonth())
  const [entries, setEntries] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = { from: range.from, to: range.to }
    if (filter !== 'all') params.type = filter
    const data = await getEntries(params)
    setEntries(data)
    setLoading(false)
  }, [range, filter])

  useEffect(() => { load() }, [load])

  const handleUpdate = async (id, data) => { await updateEntry(id, data); load() }
  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    await deleteEntry(id); load()
  }

  const grouped = entries.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const totalIncome  = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)

  const filterBtnCls = (active) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-indigo-600 text-white'
        : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
    }`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">History</h1>
          {entries.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {entries.length} entries · +{fmt(totalIncome)} / -{fmt(totalExpense)}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex gap-2">
            {['all', 'income', 'expense'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={filterBtnCls(filter === f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} className={dateCls} />
            <span className="text-gray-400 dark:text-gray-500 text-sm">to</span>
            <input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} className={dateCls} />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">Loading...</p>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-10 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-2">📜</p>
          <p className="text-sm">No entries found for this period.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => {
            const dayEntries = grouped[date]
            const dayIncome  = dayEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
            const dayExpense = dayEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
            const label = new Date(date + 'T00:00:00').toLocaleDateString('en', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            })
            return (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-1.5">
                  <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</h2>
                  <div className="flex gap-3 text-xs font-medium">
                    {dayIncome  > 0 && <span className="text-green-600 dark:text-green-400">+{fmt(dayIncome)}</span>}
                    {dayExpense > 0 && <span className="text-red-600 dark:text-red-400">-{fmt(dayExpense)}</span>}
                  </div>
                </div>
                {dayEntries.map(e => (
                  <EntryCard key={e.id} entry={e} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
