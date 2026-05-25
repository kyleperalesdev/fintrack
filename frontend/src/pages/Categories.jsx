import { useState, useEffect, useRef } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api'

const cardCls = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5'
const inputCls = 'flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400'

function CategoryPanel({ type, categories, onAdd, onRename, onDelete }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [deleteError, setDeleteError] = useState({})
  const editRef = useRef(null)

  const label = type === 'income' ? 'Income' : 'Expense'
  const accent = type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
  const addBtnCls = type === 'income'
    ? 'px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
    : 'px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
    setDeleteError({})
    setTimeout(() => editRef.current?.focus(), 0)
  }

  const cancelEdit = () => { setEditingId(null); setEditingName('') }

  const handleRename = async (id) => {
    const trimmed = editingName.trim()
    if (!trimmed) return
    const err = await onRename(id, trimmed)
    if (!err) { setEditingId(null); setEditingName('') }
  }

  const handleDelete = async (cat) => {
    const err = await onDelete(cat.id)
    if (err) setDeleteError(prev => ({ ...prev, [cat.id]: err }))
    else setDeleteError(prev => { const n = { ...prev }; delete n[cat.id]; return n })
  }

  const handleAdd = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const err = await onAdd(trimmed, type)
    if (!err) setNewName('')
  }

  return (
    <div className={cardCls}>
      <h2 className={`text-base font-semibold mb-4 ${accent}`}>{label} Categories</h2>

      <ul className="space-y-1 mb-4">
        {categories.length === 0 && (
          <li className="text-sm text-gray-400 dark:text-gray-500 py-2">No categories yet.</li>
        )}
        {categories.map(cat => (
          <li key={cat.id}>
            {editingId === cat.id ? (
              <div className="flex gap-2 items-center">
                <input
                  ref={editRef}
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename(cat.id)
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  className={inputCls}
                />
                <button
                  onClick={() => handleRename(cat.id)}
                  className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                  <span className="text-sm text-gray-800 dark:text-gray-200">{cat.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(cat)}
                      title="Rename"
                      className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      title="Delete"
                      className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {deleteError[cat.id] && (
                  <p className="text-xs text-red-500 dark:text-red-400 px-2 pb-1">{deleteError[cat.id]}</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={`New ${label.toLowerCase()} category...`}
          className={inputCls}
        />
        <button onClick={handleAdd} className={addBtnCls}>Add</button>
      </div>
    </div>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [globalError, setGlobalError] = useState('')

  const load = () =>
    getCategories().then(data => { setCategories(data); setLoading(false) })

  useEffect(() => { load() }, [])

  const income = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  const handleAdd = async (name, type) => {
    setGlobalError('')
    const result = await createCategory({ name, type })
    if (result.error) { setGlobalError(result.error); return result.error }
    load()
    return null
  }

  const handleRename = async (id, name) => {
    setGlobalError('')
    const result = await updateCategory(id, { name })
    if (result.error) { setGlobalError(result.error); return result.error }
    load()
    return null
  }

  const handleDelete = async (id) => {
    setGlobalError('')
    const result = await deleteCategory(id)
    if (result.error) return result.error
    load()
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Categories</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500">Categories in use by transactions cannot be deleted.</p>
      </div>

      {globalError && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {globalError}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CategoryPanel
            type="income"
            categories={income}
            onAdd={handleAdd}
            onRename={handleRename}
            onDelete={handleDelete}
          />
          <CategoryPanel
            type="expense"
            categories={expense}
            onAdd={handleAdd}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  )
}
