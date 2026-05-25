import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, useDark } from './ThemeContext'
import Navigation from './components/Navigation'
import Daily from './pages/Daily'
import Breakdown from './pages/Breakdown'
import History from './pages/History'
import Observations from './pages/Observations'
import Import from './pages/Import'
import Categories from './pages/Categories'
import Export from './pages/Export'

function AppShell() {
  const { dark } = useDark()
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navigation />
        <main className="max-w-5xl mx-auto px-4 py-4 sm:py-6 pb-20 md:pb-6">
          <Routes>
            <Route path="/" element={<Navigate to="/daily" replace />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/breakdown" element={<Breakdown />} />
            <Route path="/history" element={<History />} />
            <Route path="/observations" element={<Observations />} />
            <Route path="/import" element={<Import />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/export" element={<Export />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  )
}
