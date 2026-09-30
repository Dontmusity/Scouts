import { lazy, Suspense, useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import {
  ChartBarIcon,
  ClipboardTextIcon,
  CalendarDotsIcon,
  GearSixIcon,
  HardDrivesIcon,
  ListChecksIcon,
  WifiSlashIcon,
  WrenchIcon,
  type Icon,
} from '@phosphor-icons/react'
import { useScoutStore } from './store/useScoutStore'
import { usePitStore } from './store/usePitStore'
import { useDisplayPrefsStore } from './store/useDisplayPrefsStore'
import { TEAMS, mayaGlyphs } from './data/team'
import { MatchForm } from './components/MatchForm'
import { ConfigEditor } from './components/ConfigEditor'
import { MatchList } from './components/MatchList'
import { EventsTab } from './components/EventsTab'
import { PitScouting } from './components/PitScouting'

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard').then((m) => ({ default: m.Dashboard })))

type Tab = 'scout' | 'matches' | 'pit' | 'events' | 'dashboard' | 'admin'

const tabs: { id: Tab; label: string; icon: Icon }[] = [
  { id: 'scout', label: 'Scouting', icon: ClipboardTextIcon },
  { id: 'matches', label: 'Partidos', icon: ListChecksIcon },
  { id: 'pit', label: 'Pit', icon: WrenchIcon },
  { id: 'events', label: 'Eventos', icon: CalendarDotsIcon },
  { id: 'dashboard', label: 'Análisis', icon: ChartBarIcon },
  { id: 'admin', label: 'Ajustes', icon: GearSixIcon },
]

export default function App() {
  const { init, loaded, config, matches } = useScoutStore()
  const initPit = usePitStore((s) => s.init)
  const { theme, accFRC, accFTC } = useDisplayPrefsStore()
  const [tab, setTab] = useState<Tab>('scout')
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (loaded) initPit()
  }, [loaded, initPit])

  // Tema y acento viven en <html> para que los tokens lleguen también a modales y overlays
  useEffect(() => {
    document.documentElement.dataset.tk = theme
    document.documentElement.dataset.acc = config.mode === 'FTC' ? accFTC : accFRC
  }, [theme, accFRC, accFTC, config.mode])

  if (!loaded) {
    return <div className="p-8 text-center text-n72">Cargando…</div>
  }

  const team = TEAMS[config.mode]
  const subtitle = `${config.gameName} · ${config.season}`
  const logo = (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[11px] font-extrabold text-brand [font-stretch:62%]">
      {team.number}
    </div>
  )

  const navButton = (t: (typeof tabs)[number], variant: 'bar' | 'rail' | 'wide') => {
    const active = tab === t.id
    const I = t.icon
    const icon = <I size={24} className="shrink-0" weight={active ? 'fill' : 'duotone'} />
    const tone = active ? 'text-fg' : 'text-n75'
    if (variant === 'wide')
      return (
        <button
          key={t.id}
          className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 font-semibold ${tone} ${active ? 'bg-n27' : ''}`}
          onClick={() => setTab(t.id)}
        >
          {icon}
          {t.label}
        </button>
      )
    return (
      <button
        key={t.id}
        className={`flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold ${tone}`}
        onClick={() => setTab(t.id)}
      >
        <span className={`flex h-[30px] w-[52px] items-center justify-center rounded-full ${active ? 'bg-n27' : ''}`}>{icon}</span>
        {t.label}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-n12 text-fg sm:flex">
      {/* iPad: riel angosto · compu (≥1080): riel ancho con marca */}
      <aside data-chrome className="sticky top-0 hidden h-screen shrink-0 flex-col bg-brand p-3 sm:flex sm:w-24 desk:w-60">
        <div className="mb-6 flex items-center gap-3 desk:px-2">
          {logo}
          <div className="hidden min-w-0 desk:block">
            <p className="truncate font-extrabold leading-tight">
              {team.name} {team.number}
            </p>
            <p className="truncate font-mono text-[11px] uppercase text-n75">{subtitle}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 desk:hidden">{tabs.map((t) => navButton(t, 'rail'))}</nav>
        <nav className="hidden flex-col gap-1 desk:flex">{tabs.map((t) => navButton(t, 'wide'))}</nav>
        <div className="mt-auto hidden desk:block">
          <div className="mb-3 flex items-end justify-between px-2">
            <span className="tk-outline text-[84px] text-n75">{team.number}</span>
            <span className="tk-maya flex flex-col gap-1 text-2xl">
              {mayaGlyphs(team.number).map((g, i) => (
                <span key={i}>{g}</span>
              ))}
            </span>
          </div>
          <p className="flex items-center gap-2 rounded-xl bg-n27 p-3 text-xs">
            <HardDrivesIcon size={16} className="text-grn" />
            {matches.length} partidos en este dispositivo
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Teléfono: encabezado de marca con ajustes en el engrane */}
        <header data-chrome className="flex items-center gap-3 bg-brand px-4 py-3 sm:hidden">
          {logo}
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold leading-tight">
              {team.name} {team.number}
            </p>
            <p className="truncate font-mono text-[11px] uppercase text-n75">{subtitle}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-n27 px-3 py-1 font-mono text-xs" title="Partidos guardados en este dispositivo">
            <WifiSlashIcon size={14} />
            {matches.length}
          </span>
          <button className="flex h-11 w-11 items-center justify-center rounded-xl" aria-label="Ajustes" onClick={() => setTab('admin')}>
            <GearSixIcon size={24} weight={tab === 'admin' ? 'fill' : 'duotone'} />
          </button>
        </header>

        {needRefresh && (
          <button className="w-full bg-acc py-2 text-sm font-bold text-on-acc" onClick={() => updateServiceWorker(true)}>
            Hay una versión nueva — toca para actualizar
          </button>
        )}

        <main className="mx-auto max-w-[1240px] pb-24 sm:pb-8">
          {tab === 'scout' && <MatchForm />}
          {tab === 'matches' && <MatchList />}
          {tab === 'pit' && <PitScouting />}
          {tab === 'events' && <EventsTab />}
          {tab === 'dashboard' && (
            <Suspense fallback={<div className="p-8 text-center text-n60">Cargando análisis…</div>}>
              <Dashboard />
            </Suspense>
          )}
          {tab === 'admin' && <ConfigEditor />}
        </main>
      </div>

      <nav data-chrome className="fixed bottom-0 left-0 right-0 flex bg-brand pb-[env(safe-area-inset-bottom)] sm:hidden">
        {tabs.filter((t) => t.id !== 'admin').map((t) => navButton(t, 'bar'))}
      </nav>
    </div>
  )
}
