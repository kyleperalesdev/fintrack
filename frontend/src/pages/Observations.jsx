import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { getSummary } from '../api'
import { useDark } from '../ThemeContext'

const SAVINGS_TARGET = 35
const EXPENSE_COLORS = ['#ef4444','#f97316','#f59e0b','#84cc16','#10b981','#3b82f6','#6366f1','#8b5cf6','#ec4899','#14b8a6']
const fmt = (n) => `₱${Number(n).toLocaleString('en', { minimumFractionDigits: 2 })}`
const dateCls = 'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:[color-scheme:dark]'

const currentMonth = () => {
  const d = new Date()
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, d.getMonth() + 1, 0).getDate()
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, '0')}` }
}

export default function Observations() {
  const { dark } = useDark()
  const [range, setRange] = useState(currentMonth())
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSummary(range).then(d => { setSummary(d); setLoading(false) })
  }, [range])

  if (loading) return <p className="text-center text-gray-400 dark:text-gray-500 py-16 text-sm">Loading observations...</p>

  const income  = summary?.totals.find(t => t.type === 'income')?.total  || 0
  const expense = summary?.totals.find(t => t.type === 'expense')?.total || 0
  const net = income - expense
  const savingsRate = income > 0 ? (net / income) * 100 : 0
  const aboveTarget = savingsRate >= SAVINGS_TARGET

  const fromDate = new Date(range.from + 'T00:00:00')
  const toDate   = new Date(range.to   + 'T00:00:00')
  const dayCount = Math.max(1, Math.round((toDate - fromDate) / 86400000) + 1)

  const expenseCats = (summary?.categories || [])
    .filter(c => c.type === 'expense')
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  const trendMap = {}
  ;(summary?.daily || []).forEach(d => {
    if (!trendMap[d.date]) trendMap[d.date] = { date: d.date, income: 0, expense: 0 }
    trendMap[d.date][d.type] = d.total
  })
  const trendData = Object.values(trendMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      label: new Date(d.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    }))

  let spendingTrend = 'Stable'
  let trendBadgeCls = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
  if (trendData.length >= 4) {
    const half = Math.ceil(trendData.length / 2)
    const firstHalf  = trendData.slice(0, half).reduce((s, d) => s + d.expense, 0)
    const secondHalf = trendData.slice(half).reduce((s, d) => s + d.expense, 0)
    if (secondHalf > firstHalf * 1.1) {
      spendingTrend = '↑ Increasing'
      trendBadgeCls = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    } else if (secondHalf < firstHalf * 0.9) {
      spendingTrend = '↓ Decreasing'
      trendBadgeCls = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    }
  }

  const noData = income === 0 && expense === 0

  const chartGrid   = dark ? '#374151' : '#f3f4f6'
  const chartTick   = dark ? '#9ca3af' : '#6b7280'
  const tooltipStyle = {
    backgroundColor: dark ? '#1f2937' : '#ffffff',
    border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
    color: dark ? '#f9fafb' : '#111827',
    borderRadius: '8px',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Observations</h1>
        <div className="flex gap-2 items-center">
          <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} className={dateCls} />
          <span className="text-gray-400 dark:text-gray-500 text-sm">to</span>
          <input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} className={dateCls} />
        </div>
      </div>

      {noData ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-sm">No data for this period. Start adding entries!</p>
        </div>
      ) : (
        <>
          {/* Savings Rate */}
          <div className={`rounded-xl border p-5 ${
            aboveTarget
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Savings Rate</p>
                <p className={`text-5xl font-bold mt-1 ${aboveTarget ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
                  {income === 0 ? 'N/A' : `${savingsRate.toFixed(1)}%`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Target: <strong>{SAVINGS_TARGET}%</strong></p>
                {income > 0 && (
                  <p className={`text-sm font-semibold mt-1 ${aboveTarget ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {aboveTarget
                      ? `${(savingsRate - SAVINGS_TARGET).toFixed(1)}% above target`
                      : `${(SAVINGS_TARGET - savingsRate).toFixed(1)}% below target`}
                  </p>
                )}
              </div>
            </div>

            {income > 0 && (
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-5">
                  <div
                    className={`h-5 rounded-full transition-all duration-500 ${aboveTarget ? 'bg-green-500' : 'bg-orange-400'}`}
                    style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                  />
                </div>
                <div className="absolute top-0 h-5 flex flex-col items-center" style={{ left: `${SAVINGS_TARGET}%` }}>
                  <div className="w-0.5 h-5 bg-gray-600 dark:bg-gray-300" />
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold mt-1 -translate-x-1/2">{SAVINGS_TARGET}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Net Savings + Daily Average */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-2">Net Savings</p>
              <p className={`text-2xl font-bold ${net >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>{fmt(net)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span className="text-green-600 dark:text-green-400">{fmt(income)}</span> income &minus; <span className="text-red-600 dark:text-red-400">{fmt(expense)}</span> expenses
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-2">
                Daily Average <span className="normal-case text-gray-400 dark:text-gray-500">({dayCount} days)</span>
              </p>
              <div className="flex gap-5">
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Income</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">{fmt(income / dayCount)}</p>
                </div>
                <div>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">Expense</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">{fmt(expense / dayCount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Spending Trend Chart */}
          {trendData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Spending Trends</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${trendBadgeCls}`}>
                  {spendingTrend}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTick }} />
                  <YAxis tick={{ fontSize: 11, fill: chartTick }} tickFormatter={v => v >= 1000 ? `₱${(v/1000).toFixed(0)}k` : `₱${v}`} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: dark ? '#d1d5db' : '#374151' }} />
                  <Line type="monotone" dataKey="income"  stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Expense" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Expense Categories */}
          {expenseCats.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Top Expense Categories</h2>
              <ResponsiveContainer width="100%" height={Math.max(150, expenseCats.length * 40)}>
                <BarChart data={expenseCats} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: chartTick }} tickFormatter={v => `₱${v.toLocaleString('en')}`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: chartTick }} width={110} />
                  <Tooltip formatter={(v) => [fmt(v), 'Amount']} contentStyle={tooltipStyle} />
                  <Bar dataKey="total" name="Amount" radius={[0, 4, 4, 0]}>
                    {expenseCats.map((_, i) => <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
