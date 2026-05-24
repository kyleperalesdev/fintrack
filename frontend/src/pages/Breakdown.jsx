import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { getSummary } from '../api'
import { useDark } from '../ThemeContext'

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16']
const fmt = (n) => `₱${Number(n).toLocaleString('en', { minimumFractionDigits: 2 })}`
const dateCls = 'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:[color-scheme:dark]'

const currentMonth = () => {
  const d = new Date()
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, d.getMonth() + 1, 0).getDate()
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, '0')}` }
}

export default function Breakdown() {
  const { dark } = useDark()
  const [range, setRange] = useState(currentMonth())
  const [summary, setSummary] = useState(null)
  const [tab, setTab] = useState('expense')

  useEffect(() => {
    getSummary(range).then(setSummary)
  }, [range])

  const income  = summary?.totals.find(t => t.type === 'income')?.total  || 0
  const expense = summary?.totals.find(t => t.type === 'expense')?.total || 0
  const net = income - expense

  const catData = (summary?.categories || [])
    .filter(c => c.type === tab)
    .map((c, i) => ({ name: c.category, value: c.total, count: c.count, color: COLORS[i % COLORS.length] }))

  const catTotal = catData.reduce((s, c) => s + c.value, 0)

  const RADIAN = Math.PI / 180
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null
    const r = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
        {(percent * 100).toFixed(0)}%
      </text>
    )
  }

  const tooltipStyle = {
    backgroundColor: dark ? '#1f2937' : '#ffffff',
    border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
    color: dark ? '#f9fafb' : '#111827',
    borderRadius: '8px',
  }

  const tabBtnCls = (active) =>
    `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-indigo-600 text-white'
        : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
    }`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Breakdown</h1>
        <div className="flex gap-2 items-center">
          <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} className={dateCls} />
          <span className="text-gray-400 dark:text-gray-500 text-sm">to</span>
          <input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} className={dateCls} />
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Total Income</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{fmt(income)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">Total Expenses</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">{fmt(expense)}</p>
        </div>
        <div className={`border rounded-xl p-4 ${
          net >= 0
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
        }`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Net</p>
          <p className={`text-2xl font-bold mt-1 ${net >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>{fmt(net)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['expense', 'income'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={tabBtnCls(tab === t)}>
            {t === 'expense' ? 'Expenses' : 'Income'} by Category
          </button>
        ))}
      </div>

      {catData.length === 0 ? (
        <div className="text-center py-10 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-sm">No {tab} data for this period.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={renderLabel}>
                  {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 overflow-y-auto max-h-72">
            {catData.map((c, i) => {
              const pct = catTotal > 0 ? (c.value / catTotal * 100).toFixed(1) : 0
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{c.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{fmt(c.value)}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{c.count} {c.count === 1 ? 'entry' : 'entries'} · {pct}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
