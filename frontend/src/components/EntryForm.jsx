import { useState } from 'react'

const INCOME_CATEGORIES = ['Salary', 'Bonus', 'Freelance', 'Other income']
const EXPENSE_CATEGORIES = [
  'Housing & utilities', 'Groceries', 'Dining out', 'Transportation',
  'Healthcare', 'Personal & lifestyle', 'Baby & family', 'Subscriptions', 'Miscellaneous',
]

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:[color-scheme:dark]'

export default function EntryForm({ onSubmit, initial = {}, onCancel }) {
  const [form, setForm] = useState({
    date: initial.date || new Date().toISOString().split('T')[0],
    type: initial.type || 'expense',
    category: initial.category || '',
    description: initial.description || '',
    amount: initial.amount || '',
  })

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const set = (k, v) =>
    setForm(f => ({ ...f, [k]: v, ...(k === 'type' ? { category: '' } : {}) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.category || !form.amount) return
    onSubmit({ ...form, amount: parseFloat(form.amount) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
          <div className="flex gap-2 h-[38px]">
            {['income', 'expense'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className={`flex-1 rounded-lg text-sm font-medium border transition-colors ${
                  form.type === t
                    ? t === 'income'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-red-500 text-white border-red-500'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t === 'income' ? '+ Income' : '- Expense'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            required
            className={inputCls}
          >
            <option value="">Select category...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount (₱)</label>
          <input
            type="number"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            min="0.01"
            step="0.01"
            required
            placeholder="0.00"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description (optional)</label>
        <input
          type="text"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Brief description..."
          className={inputCls}
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {initial.id ? 'Update Entry' : 'Add Entry'}
        </button>
      </div>
    </form>
  )
}
