import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useFilters } from '../context/FilterContext'
import { getSummaryKPIs, getEventsOverTime, getSeverityBreakdown, getEventTypeBreakdown } from '../api/client'
import KPICard from '../components/KPICard'

const SEV_COLOR = { notice: '#3b82f6', information: '#10b981', warning: '#f59e0b' }
const TT = { contentStyle: { backgroundColor:'#1f2937', border:'1px solid #374151', borderRadius:'6px' }, labelStyle:{ color:'#f9fafb' } }

export default function Summary() {
  const { filters } = useFilters()
  const [kpis,       setKpis]       = useState(null)
  const [timeline,   setTimeline]   = useState([])
  const [severity,   setSeverity]   = useState([])
  const [eventTypes, setEventTypes] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getSummaryKPIs(filters),
      getEventsOverTime(filters, 'day'),
      getSeverityBreakdown(filters),
      getEventTypeBreakdown(filters),
    ]).then(([k, t, s, e]) => {
      setKpis(k.data)
      setTimeline(t.data)
      setSeverity(s.data)
      setEventTypes(e.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [filters])

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-white">Summary</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <KPICard label="Total Events"   value={kpis?.total_events}   color="blue"   />
        <KPICard label="Total Sessions" value={kpis?.total_sessions} color="green"  />
        <KPICard label="Threat Events"  value={kpis?.threat_events}  color="red"    />
        <KPICard label="Unique Src IPs" value={kpis?.unique_src_ips} color="purple" />
        <KPICard label="Warning Events" value={kpis?.warning_events} color="yellow" />
      </div>

      {/* Events over time */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-4">Events Over Time</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time_bucket" tick={{ fill:'#9ca3af', fontSize:11 }} />
            <YAxis tick={{ fill:'#9ca3af', fontSize:11 }} />
            <Tooltip {...TT} />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Severity + Event type */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Severity Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severity} dataKey="count" nameKey="severity"
                cx="50%" cy="50%" outerRadius={110}
                label={({ severity: s, percent }) => `${s} ${(percent*100).toFixed(0)}%`}
              >
                {severity.map(e => <Cell key={e.severity} fill={SEV_COLOR[e.severity] || '#6b7280'} />)}
              </Pie>
              <Tooltip {...TT} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-4">Event Type Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eventTypes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" tick={{ fill:'#9ca3af', fontSize:11 }} />
              <YAxis type="category" dataKey="event_subtype" width={65} tick={{ fill:'#9ca3af', fontSize:11 }} />
              <Tooltip {...TT} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
