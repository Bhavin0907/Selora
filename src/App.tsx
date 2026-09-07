import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { TopStatusBar } from './components/TopStatusBar'
import { CrtOverlay } from './components/CrtOverlay'
import { HomePage } from './pages/HomePage'
import { LogPage } from './pages/LogPage'
import { MapPage } from './pages/MapPage'
import { InsightsPage } from './pages/InsightsPage'
import { AdvisorPage } from './pages/AdvisorPage'
import { PactPage } from './pages/PactPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-full starfield font-body">
        <TopStatusBar />
        <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/log" element={<LogPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/advisor" element={<AdvisorPage />} />
            <Route path="/pact" element={<PactPage />} />
          </Routes>
        </main>
        <BottomNav />
        <CrtOverlay />
      </div>
    </BrowserRouter>
  )
}

export default App
