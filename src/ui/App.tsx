import { Route, Routes } from 'react-router-dom'
import { Shell } from './shell/Shell'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { TalkPage } from './pages/TalkPage'
import { BuildPage } from './pages/BuildPage'
import { VaultPage } from './pages/VaultPage'
import { MarketPage } from './pages/MarketPage'
import { PoolsPage } from './pages/PoolsPage'
import { DashboardPage } from './pages/DashboardPage'

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/talk" element={<TalkPage />} />
        <Route path="/build" element={<BuildPage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/pools" element={<PoolsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

