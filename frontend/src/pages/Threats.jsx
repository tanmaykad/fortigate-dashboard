import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useFilters } from '../context/FilterContext'
import { getThreatEvents, getThreatsByApp, getThreatsTimeline } from '../api/client'

const TT = { contentStyle:{ backgroundColor:'#1f2937', border:'1px solid #374151', borderRadius:'6px' }, labelStyle:{ color:'#f9fafb' } }

const BADGE = {
  medium:   'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  high:     'bg-orange-500/20 text-orange-400 border border-orange-500/40',
  critical: 'bg-red-500/20   text-red-400   border border-red-500/40',
  low:      'bg-blue-500/20  text-blue-400  border border-blue-500/40',
  warning:  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
}

export default function Threats() {
  const { filters }   = useFilters()
  const [events,    setEvents]   = useState({ total:0, data:[] })
  const [byApp,     setByApp]    = useState([])
  const [timeline,  setTimeline] = useState([])
  const [page,      setPage]     = useState(1)
  const [loading,   setLoading]  = useState(true)

  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getThreatEvents(filters, page, 20),
      getThreatsByApp(filters),
      getThreatsTimeline(filters, 'day'),
    ]).then(([ev, app, tl]) => {
      setEvents(ev.data)
      setByApp(app.data)
      setTimeline(tl.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [filters, page])

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Security & Threat Events</h2>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-4">Warning Events Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time_bucket" tick={{ fill:'#9ca3af', fontSize:11 }} />
              <YAxis tick={{ fill:'#9ca3af', fontSize:11 }} />
              <Tooltip {...TT} />
              <Line type="monotone" dataKey="count" stroke="#f59e0b" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-4">Threats by Application</h3>
          {byApp.length === 0
            ? <p className="text-sm text-gray-500 mt-12 text-center">No threat data for current filters</p>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byApp} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fill:'#9ca3af', fontSize:11 }} />
                  <YAxis type="category" dataKey="app" width={70} tick={{ fill:'#9ca3af', fontSize:11 }} />
                  <Tooltip {...TT} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>

      </div>

      {/* Paginated events table */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">
            Warning Events
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({events.total.toLocaleString()} total)
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              className="px-2 py-1 text-xs bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-600"
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-400">Page {page}</span>
            <button
              onClick={() => setPage(p => p+1)}
              disabled={events.data.length < 20}
              className="px-2 py-1 text-xs bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-600"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-300">
            <thead>
              <tr className="text-gray-500 border-b border-gray-700 text-left">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Src IP</th>
                <th className="py-2 pr-3">App</th>
                <th className="py-2 pr-3">Threat</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Severity</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {events.data.map(e => (
                <tr key={e.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-1.5 pr-3">{e.itime?.slice(0,16) || '—'}</td>
                  <td className="py-1.5 pr-3 font-mono">{e.src_ip || '—'}</td>
                  <td className="py-1.5 pr-3">{e.app_name || '—'}</td>
                  <td className="py-1.5 pr-3">{e.threat_name || '—'}</td>
                  <td className="py-1.5 pr-3">{e.threat_type || e.event_subtype || '—'}</td>
                  <td className="py-1.5 pr-3">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${BADGE[e.threat_severity] || BADGE[e.event_severity] || BADGE.medium}`}>
                      {e.threat_severity || e.event_severity || '—'}
                    </span>
                  </td>
                  <td className="py-1.5">{e.threat_action || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
