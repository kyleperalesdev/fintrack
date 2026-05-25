import { useState, useEffect } from 'react'
import { getSummary } from '../api'

const cardCls = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5'
const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:[color-scheme:dark]'

function monthRange(offset = 0) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  const from = d.toISOString().split('T')[0]
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  const to = d.toISOString().split('T')[0]
  return { from, to }
}

function yearRange() {
  const y = new Date().getFullYear()
  return { from: `${y}-01-01`, to: `${y}-12-31` }
}

const PRESETS = [
  { label: 'This Month',  range: () => monthRange(0) },
  { label: 'Last Month',  range: () => monthRange(-1) },
  { label: 'This Year',   range: () => yearRange() },
]

const fmt = (n) =>
  `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Export() {
  const init = monthRange(0)
  const [from, setFrom] = useState(init.from)
  const [to, setTo]     = useState(init.to)
  const [summary, setSummary] = useState(null)
  const [exporting, setExporting] = useState(false)

  const rangeValid = from && to && from <= to

  useEffect(() => {
    if (!rangeValid) { setSummary(null); return }
    getSummary({ from, to }).then(setSummary)
  }, [from, to])

  const income   = summary?.totals?.find(t => t.type === 'income')
  const expense  = summary?.totals?.find(t => t.type === 'expense')
  const total    = (income?.count ?? 0) + (expense?.count ?? 0)
  const canExport = rangeValid && summary !== null && total > 0

  const handleExport = async () => {
    if (!canExport) return
    setExporting(true)
    try {
      const qs = new URLSearchParams({ from, to }).toString()
      const res = await fetch(`/api/export?${qs}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `fintrack_${from}_to_${to}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const activePreset = PRESETS.find(p => {
    const r = p.range()
    return r.from === from && r.to === to
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Export Transactions</h1>

      <div className={cardCls}>
        {/* Quick presets */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick select</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => {
              const isActive = activePreset?.label === p.label
              return (
                <button
                  key={p.label}
                  onClick={() => { const r = p.range(); setFrom(r.from); setTo(r.to) }}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Date range */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Validation */}
        {from && to && from > to && (
          <p className="mb-4 text-sm text-red-500 dark:text-red-400">"From" date must be before "To" date.</p>
        )}

        {/* Preview */}
        {summary && rangeValid && (
          <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {total === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found for this date range.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {total} transaction{total !== 1 ? 's' : ''} will be exported
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {income?.count > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      Income: {fmt(income.total)} &nbsp;({income.count})
                    </span>
                  )}
                  {expense?.count > 0 && (
                    <span className="text-red-500 dark:text-red-400">
                      Expenses: {fmt(expense.total)} &nbsp;({expense.count})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={!canExport || exporting}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? 'Exporting…' : 'Export to Excel'}
        </button>
      </div>
    </div>
  )
}
