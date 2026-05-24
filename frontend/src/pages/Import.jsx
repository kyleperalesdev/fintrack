import { useState, useRef, useCallback, useEffect } from 'react'
import { parseImportFile, checkDuplicates, confirmImport } from '../api'

const STEPS = ['Upload', 'Map Categories', 'Confirm & Import']

const card = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm'
const inputCls = 'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400'

// ─── Step 1: Upload ────────────────────────────────────────────────────────────
function StepUpload({ onParsed }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFile = useCallback((f) => {
    if (!f) return
    if (!f.name.endsWith('.xlsx')) {
      setError('Please select an .xlsx Excel file.')
      return
    }
    setFile(f)
    setError(null)
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleParse = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const result = await parseImportFile(file)
      if (result.error) throw new Error(result.error)
      onParsed(result, file.name)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Upload Excel File</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your .xlsx file must have two sheets: <span className="font-medium text-gray-700 dark:text-gray-300">Setup</span> and <span className="font-medium text-gray-700 dark:text-gray-300">Transactions</span>.
        </p>
      </div>

      {/* File format guide */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Setup Sheet</p>
          <table className="text-xs w-full">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400">
                <th className="text-left pr-4 pb-1">A — Income</th>
                <th className="text-left pb-1">B — Expense</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr><td className="pr-4">Salary</td><td>Groceries</td></tr>
              <tr><td className="pr-4">Freelance</td><td>Transportation</td></tr>
              <tr><td className="pr-4">Bonus</td><td>Dining out</td></tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Transactions Sheet</p>
          <table className="text-xs w-full">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400">
                <th className="text-left pr-2 pb-1">Date</th>
                <th className="text-left pr-2 pb-1">Type</th>
                <th className="text-left pr-2 pb-1">Category</th>
                <th className="text-left pr-2 pb-1">Amount</th>
                <th className="text-left pb-1">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr>
                <td className="pr-2">2024-01-15</td>
                <td className="pr-2">income</td>
                <td className="pr-2">Salary</td>
                <td className="pr-2">50000</td>
                <td>Jan pay</td>
              </tr>
              <tr>
                <td className="pr-2">2024-01-16</td>
                <td className="pr-2">expense</td>
                <td className="pr-2">Groceries</td>
                <td className="pr-2">1200</td>
                <td>Supermarket</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/30'
        }`}
      >
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        <div className="text-4xl mb-3">{file ? '📄' : '📂'}</div>
        {file ? (
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{file.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Drop your .xlsx file here</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleParse}
          disabled={!file || loading}
          className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Parsing...' : 'Parse File →'}
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Map Categories ────────────────────────────────────────────────────
function StepMapCategories({ parseResult, mappings, setMappings, onNext, onBack }) {
  const { mappingSuggestions, defaultCategories } = parseResult
  const allKeys = Object.keys(mappingSuggestions)

  // Unmatched categories start in "create new" mode with the csv name pre-filled
  const [newCategoryInputs, setNewCategoryInputs] = useState(() => {
    const init = {}
    allKeys.forEach(k => {
      if (mappingSuggestions[k].isNew) {
        init[k] = mappings[k] || mappingSuggestions[k].csvCategory
      }
    })
    return init
  })

  const setMapping = (key, value) => setMappings(m => ({ ...m, [key]: value }))

  const handleSelectChange = (key, value) => {
    if (value === '__new__') {
      const defaults = defaultCategories[mappingSuggestions[key].type]
      const cur = mappings[key]
      const initialName = (cur && !defaults.includes(cur)) ? cur : mappingSuggestions[key].csvCategory
      setNewCategoryInputs(n => ({ ...n, [key]: initialName }))
      setMapping(key, initialName)
    } else {
      setNewCategoryInputs(n => { const c = { ...n }; delete c[key]; return c })
      setMapping(key, value)
    }
  }

  const unmappedKeys = allKeys.filter(key => {
    const val = mappings[key]
    return !val || !val.trim()
  })

  const canProceed = unmappedKeys.length === 0

  if (allKeys.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Map Categories</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">No categories found in the file.</p>
        </div>
        <div className="flex justify-between">
          <button onClick={onBack} className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">← Back</button>
          <button onClick={onNext} className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Next →</button>
        </div>
      </div>
    )
  }

  const incomeKeys = allKeys.filter(k => mappingSuggestions[k].type === 'income')
  const expenseKeys = allKeys.filter(k => mappingSuggestions[k].type === 'expense')

  const renderGroup = (keys, type) => {
    if (!keys.length) return null
    const defaults = defaultCategories[type]
    const label = type === 'income' ? 'Income' : 'Expense'
    const badgeColor = type === 'income'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'

    return (
      <div key={type}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeColor}`}>{label}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{keys.length} categories</span>
        </div>
        <div className="space-y-3">
          {keys.map(key => {
            const { csvCategory } = mappingSuggestions[key]
            const currentMapping = mappings[key] || ''
            const isCreatingNew = key in newCategoryInputs
            const isEmpty = !currentMapping.trim()
            const isCustomNew = !isEmpty && !defaults.includes(currentMapping)

            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border ${
                isEmpty
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                  : 'bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-600'
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{csvCategory}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">from CSV</p>
                </div>
                <div className="text-gray-400 dark:text-gray-500 text-sm">→</div>
                <div className="flex-1">
                  {isCreatingNew ? (
                    <input
                      type="text"
                      value={newCategoryInputs[key] || ''}
                      onChange={e => {
                        const v = e.target.value
                        setNewCategoryInputs(n => ({ ...n, [key]: v }))
                        setMapping(key, v)
                      }}
                      placeholder="New category name..."
                      className={`${inputCls} w-full`}
                    />
                  ) : (
                    <select
                      value={isCustomNew ? '__new__' : currentMapping}
                      onChange={e => handleSelectChange(key, e.target.value)}
                      className={`${inputCls} w-full`}
                    >
                      <option value="">Select mapping...</option>
                      {defaults.map(d => <option key={d} value={d}>{d}</option>)}
                      <option value="__new__">+ Create new category</option>
                    </select>
                  )}
                  {isCreatingNew && (
                    <button
                      onClick={() => {
                        setNewCategoryInputs(n => { const c = { ...n }; delete c[key]; return c })
                        const fallback = mappingSuggestions[key].suggestedMatch || ''
                        setMapping(key, fallback)
                      }}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-1 block"
                    >
                      ← back to list
                    </button>
                  )}
                </div>
                {isEmpty && (
                  <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">needs mapping</span>
                )}
                {!isEmpty && isCustomNew && (
                  <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full shrink-0">new</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Map Categories</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Match each CSV category to a FinTrack category. Unmatched ones are pre-filled with the CSV name — you can create them as new categories.
        </p>
      </div>

      <div className="space-y-6">
        {renderGroup(incomeKeys, 'income')}
        {renderGroup(expenseKeys, 'expense')}
      </div>

      {!canProceed && unmappedKeys.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <p className="font-medium mb-1">
            {unmappedKeys.length} categor{unmappedKeys.length === 1 ? 'y needs' : 'ies need'} mapping before proceeding:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {unmappedKeys.map(k => (
              <li key={k}>{mappingSuggestions[k].csvCategory} ({mappingSuggestions[k].type})</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Preview Rows →
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Confirm & Import ──────────────────────────────────────────────────
function StepConfirm({ parseResult, mappings, onBack, onDone }) {
  const { transactions } = parseResult
  const [selected, setSelected] = useState(() => {
    const s = {}
    transactions.forEach(tx => { if (!tx.parseErrors.length) s[tx.rowIndex] = true })
    return s
  })
  const [duplicates, setDuplicates] = useState(new Set())
  const [loadingDupes, setLoadingDupes] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showErrors, setShowErrors] = useState(true)

  const validTx = transactions.filter(tx => !tx.parseErrors.length)

  // Check duplicates as soon as this step loads
  useEffect(() => {
    if (!validTx.length) return
    setLoadingDupes(true)
    checkDuplicates(validTx, mappings)
      .then(data => {
        const dupeSet = new Set(data.duplicateRowIndices || [])
        setDuplicates(dupeSet)
        setSelected(s => {
          const updated = { ...s }
          dupeSet.forEach(idx => { updated[idx] = false })
          return updated
        })
      })
      .catch(() => {})
      .finally(() => setLoadingDupes(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleRow = (idx) => setSelected(s => ({ ...s, [idx]: !s[idx] }))
  const toggleAll = (checked) => {
    const updated = {}
    filteredValid.forEach(tx => { updated[tx.rowIndex] = checked })
    setSelected(s => ({ ...s, ...updated }))
  }

  const invalidTx = transactions.filter(tx => tx.parseErrors.length > 0)
  const filteredValid = validTx.filter(tx =>
    typeFilter === 'all' || tx.type === typeFilter
  )
  const selectedCount = Object.values(selected).filter(Boolean).length
  const dupeSelectedCount = [...duplicates].filter(idx => selected[idx]).length

  const getMappedCategory = (tx) => mappings[`${tx.type}::${tx.category}`] || tx.category

  const fmt = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

  const handleImport = async () => {
    const toImport = validTx.filter(tx => selected[tx.rowIndex])
    if (!toImport.length) return
    setLoading(true)
    setError(null)
    try {
      const data = await confirmImport(toImport, mappings)
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="space-y-6 text-center">
        <div className="text-6xl">🎉</div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Import Complete</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your transactions have been imported into FinTrack.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-left">
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.inserted}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Imported</p>
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{result.skipped}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Skipped (duplicates)</p>
          </div>
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.errors}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Errors</p>
          </div>
        </div>
        <button
          onClick={onDone}
          className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Import Another File
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Confirm & Import</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review your transactions. Duplicates are unchecked by default — re-check to include them.
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedCount}</span> of {validTx.length} selected
        </span>
        {loadingDupes && <span className="text-xs text-gray-400 dark:text-gray-500">Checking for duplicates...</span>}
        {!loadingDupes && duplicates.size > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
            {duplicates.size} possible duplicate{duplicates.size !== 1 ? 's' : ''} detected
          </span>
        )}
        {dupeSelectedCount > 0 && (
          <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full">
            {dupeSelectedCount} duplicate{dupeSelectedCount !== 1 ? 's' : ''} included
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        {['all', 'income', 'expense'].map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === f
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => toggleAll(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Select all</button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button onClick={() => toggleAll(false)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Deselect all</button>
        </div>
      </div>

      {/* Transaction table */}
      <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 max-h-96">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="w-8 px-3 py-2"></th>
              <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Date</th>
              <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Type</th>
              <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Category</th>
              <th className="px-3 py-2 text-right text-gray-500 dark:text-gray-400 font-medium">Amount</th>
              <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Description</th>
              <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredValid.map(tx => {
              const isDupe = duplicates.has(tx.rowIndex)
              const isChecked = !!selected[tx.rowIndex]
              return (
                <tr
                  key={tx.rowIndex}
                  onClick={() => toggleRow(tx.rowIndex)}
                  className={`cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                      : 'bg-gray-50/60 dark:bg-gray-800/40 opacity-60 hover:opacity-80'
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRow(tx.rowIndex)}
                      onClick={e => e.stopPropagation()}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600"
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{tx.date}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === 'income'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{getMappedCategory(tx)}</td>
                  <td className={`px-3 py-2 text-right font-medium whitespace-nowrap ${
                    tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {fmt(tx.amount)}
                  </td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 max-w-[150px] truncate">{tx.description || '—'}</td>
                  <td className="px-3 py-2">
                    {isDupe && (
                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        duplicate?
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredValid.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">No valid rows to show.</div>
        )}
      </div>

      {/* Rows with parse errors */}
      {invalidTx.length > 0 && (
        <div>
          <button
            onClick={() => setShowErrors(e => !e)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
          >
            <span>{showErrors ? '▼' : '▶'}</span>
            <span>{invalidTx.length} row{invalidTx.length !== 1 ? 's' : ''} with errors (will be skipped)</span>
          </button>
          {showErrors && (
            <div className="mt-2 rounded-lg border border-red-200 dark:border-red-800 overflow-auto max-h-40">
              <table className="w-full text-xs">
                <thead className="bg-red-50 dark:bg-red-900/20">
                  <tr>
                    <th className="px-3 py-2 text-left text-red-600 dark:text-red-400 font-medium">Row</th>
                    <th className="px-3 py-2 text-left text-red-600 dark:text-red-400 font-medium">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100 dark:divide-red-900/30">
                  {invalidTx.map(tx => (
                    <tr key={tx.rowIndex} className="bg-white dark:bg-gray-800">
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">Row {tx.rowIndex}</td>
                      <td className="px-3 py-2 text-red-600 dark:text-red-400">{tx.parseErrors.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          ← Back
        </button>
        <button
          onClick={handleImport}
          disabled={selectedCount === 0 || loading}
          className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Importing...' : `Import ${selectedCount} Transaction${selectedCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}

// ─── Main Wizard ───────────────────────────────────────────────────────────────
export default function Import() {
  const [step, setStep] = useState(0)
  const [parseResult, setParseResult] = useState(null)
  const [fileName, setFileName] = useState('')
  const [mappings, setMappings] = useState({})

  const reset = () => {
    setStep(0)
    setParseResult(null)
    setFileName('')
    setMappings({})
  }

  const handleParsed = (result, name) => {
    setParseResult(result)
    setFileName(name)
    // Pre-compute mappings synchronously so step 2 renders with values already set
    const initial = {}
    Object.entries(result.mappingSuggestions).forEach(([key, s]) => {
      initial[key] = s.suggestedMatch || s.csvCategory
    })
    setMappings(initial)
    setStep(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Import Transactions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Import income and expense entries from an Excel file.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step
                  ? 'bg-indigo-600 text-white'
                  : i === step
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${
                i === step
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : i < step
                    ? 'text-gray-600 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500'
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 transition-colors ${
                i < step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* File name badge */}
      {fileName && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>📄</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{fileName}</span>
          {parseResult && (
            <span className="text-gray-400 dark:text-gray-500">
              — {parseResult.totalRows} row{parseResult.totalRows !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      )}

      {/* Step content */}
      <div className={card}>
        {step === 0 && <StepUpload onParsed={handleParsed} />}
        {step === 1 && parseResult && (
          <StepMapCategories
            parseResult={parseResult}
            mappings={mappings}
            setMappings={setMappings}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && parseResult && (
          <StepConfirm
            parseResult={parseResult}
            mappings={mappings}
            onBack={() => setStep(1)}
            onDone={reset}
          />
        )}
      </div>
    </div>
  )
}
