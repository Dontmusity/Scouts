import { lazy, Suspense, useEffect, useState } from 'react'
import { useScoutStore } from './store/useScoutStore'
import { MatchForm } from './components/MatchForm'
import { ConfigEditor } from './components/ConfigEditor'
import { MatchList } from './components/MatchList'
import { EventsTab } from './components/EventsTab'

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard').then((m) => ({ default: m.Dashboard })))

type Tab = 'scout' | 'matches' | 'events' | 'dashboard' | 'admin'

const tabs: { id: Tab; label: string }[] = [
  { id: 'scout', label: 'Scouting' },
  { id: 'matches', label: 'Partidos' },
  { id: 'events', label: 'Eventos' },
  { id: 'dashboard', label: 'Análisis' },
  { id: 'admin', label: 'Admin' },
]

export default function App() {
  const { init, loaded, config } = useScoutStore()
  const [tab, setTab] = useState<Tab>('scout')

  useEffect(() => {
    init()
  }, [init])

  if (!loaded) {
    return <div className="p-8 text-center text-slate-400">Cargando…</div>
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 p-4 text-center">
        <h1 className="text-lg font-bold text-white">{config.gameName}</h1>
        <p className="text-xs text-slate-500">
          {config.mode} · {config.season}
        </p>
      </header>

      <main className="pb-16">
        {tab === 'scout' && <MatchForm />}
        {tab === 'matches' && <MatchList />}
        {tab === 'events' && <EventsTab />}
        {tab === 'dashboard' && (
          <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando análisis…</div>}>
            <Dashboard />
          </Suspense>
        )}
        {tab === 'admin' && <ConfigEditor />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-slate-800 bg-slate-900">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`flex-1 py-2.5 text-[11px] font-bold ${tab === t.id ? 'text-sky-400' : 'text-slate-500'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
