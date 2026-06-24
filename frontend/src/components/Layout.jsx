import { Link, useLocation } from 'react-router-dom'
import { FilterProvider } from '../context/FilterContext'
import FilterPanel from './FilterPanel'

const NAV = [
  { path: '/',        label: 'Summary',     icon: '📊' },
  { path: '/traffic', label: 'Traffic',     icon: '🌐' },
  { path: '/threats', label: 'Threats',     icon: '⚠️'  },
  { path: '/dns',     label: 'DNS',         icon: '🔍' },
  { path: '/geo',     label: 'Geographic',  icon: '🗺️'  },
]

export default function Layout({ children }) {
  const { pathname } = useLocation()

  return (
    <FilterProvider>
      <div className="flex h-screen bg-gray-900 text-white overflow-hidden">

        {/* ── Left nav ─────────────────────────────────────────── */}
        <aside className="w-60 bg-slate-800 flex-shrink-0 flex flex-col border-r border-gray-700">
          <div className="px-5 py-6 border-b border-gray-700">
            <p className="text-lg font-bold text-blue-400 tracking-wide">
  FORTIGATE ANALYTICS
</p>

<p className="text-sm text-gray-400 mt-1">
  Network Security Dashboard
</p>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-0.5">
            {NAV.map(({ path, label, icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${pathname === path
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:translate-x-1'}`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>

          <div className="px-4 py-3 border-t border-gray-700">
            <div className="text-xs text-gray-500 leading-relaxed">
  <p className="font-semibold text-gray-400">FortiGate-80F</p>
  <p>FGT80FTK23044799</p>
</div>
          </div>
        </aside>

        {/* ── Content + right filter panel ─────────────────────── */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
          <FilterPanel />
        </div>

      </div>
    </FilterProvider>
  )
}
