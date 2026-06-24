import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useFilters } from '../context/FilterContext'
import {
  getProtocols, getTopApps, getBytesOverTime,
  getTopSessions, getTopSourceIPs, getTopDestIPs,
} from '../api/client'

const PROTO_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6']
const TT = { contentStyle:{ backgroundColor:'#1f2937', border:'1px solid #374151', borderRadius:'6px' }, labelStyle:{ color:'#f9fafb' } }

const fmtBytes = b => {
  if (!b) return '0 B'
  if (b > 1048576) return `${(b/1048576).toFixed(1)} MB`
  if (b > 1024)    return `${(b/1024).toFixed(1)} KB`
  return `${b} B`
}
const fmtDur = s => {
  if (!s) return '—'
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), ss = s%60
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m ${ss}s`
  return `${ss}s`
}

function IPBar({ data, color = '#3b82f6' }) {
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.ip} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-4 text-right">{i+1}</span>
          <div className="flex-1">
            <div className="flex justify-between mb-0.5">
              <span className="text-xs font-mono text-gray-300">{d.ip}</span>
              <span className="text-xs text-gray-400">{d.count.toLocaleString()}</span>
            </div>
            <div className="h-1 bg-gray-700 rounded">
              <div className="h-1 rounded" style={{ width:`${(d.count/data[0].count)*100}%`, backgroundColor: color }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Traffic() {
  const { filters }   = useFilters()
  const [protocols,   setProtocols]  = useState([])
  const [topApps,     setTopApps]    = useState([])
  const [bytes,       setBytes]      = useState([])
  const [sessions,    setSessions]   = useState([])
  const [srcIPs,      setSrcIPs]     = useState([])
  const [dstIPs,      setDstIPs]     = useState([])
  const [sessionSort, setSessionSort]= useState('duration')
  const [loading,     setLoading]    = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getProtocols(filters),
      getTopApps(filters, 10),
      getBytesOverTime(filters, 'day'),
      getTopSessions(filters, sessionSort),
      getTopSourceIPs(filters, 10),
      getTopDestIPs(filters, 10),
    ]).then(([p, a, b, s, src, dst]) => {
      setProtocols(p.data); setTopApps(a.data); setBytes(b.data)
      setSessions(s.data);  setSrcIPs(src.data); setDstIPs(dst.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [filters, sessionSort])

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Traffic Analysis</h2>

      {/* Protocol + Top Apps */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-4">Protocol Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={protocols} dataKey="count" nameKey="protocol" cx="50%" cy="50%" outerRadius={80}
                label={({ protocol, percent }) => `${protocol} ${(percent*100).toFixed(0)}%`}>
                {protocols.map((_, i) => <Cell key={i} fill={PROTO_COLORS[i % PROTO_COLORS.length]} />)}
              </Pie>
              <Tooltip {...TT} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-4">Top Applications</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topApps} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" tick={{ fill:'#9ca3af', fontSize:11 }} />
              <YAxis type="category" dataKey="app_name" width={80} tick={{ fill:'#9ca3af', fontSize:11 }} />
              <Tooltip {...TT} />
              <Bar dataKey="count" fill="#10b981" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Bytes over time */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-4">Sent vs Received Bytes</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={bytes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time_bucket" tick={{ fill:'#9ca3af', fontSize:11 }} />
            <YAxis tickFormatter={fmtBytes} tick={{ fill:'#9ca3af', fontSize:11 }} />
            <Tooltip {...TT} formatter={v => fmtBytes(v)} />
            <Line type="monotone" dataKey="sent_bytes" stroke="#3b82f6" dot={false} strokeWidth={2} name="Sent" />
            <Line type="monotone" dataKey="recv_bytes" stroke="#10b981" dot={false} strokeWidth={2} name="Received" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Sessions */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Top Sessions</h3>
          <select
            value={sessionSort}
            onChange={e => setSessionSort(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
          >
            <option value="duration">By Duration</option>
            <option value="sent">By Bytes Sent</option>
            <option value="received">By Bytes Received</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-300">
            <thead>
              <tr className="text-gray-500 border-b border-gray-700 text-left">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Src IP</th>
                <th className="py-2 pr-3">Dst IP</th>
                <th className="py-2 pr-3">App</th>
                <th className="py-2 pr-3 text-right">Duration</th>
                <th className="py-2 pr-3 text-right">Sent</th>
                <th className="py-2 text-right">Received</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-1.5 pr-3">{s.itime?.slice(0,16) || '—'}</td>
                  <td className="py-1.5 pr-3 font-mono">{s.src_ip || '—'}</td>
                  <td className="py-1.5 pr-3 font-mono">{s.dst_ip || '—'}</td>
                  <td className="py-1.5 pr-3">{s.app_name || '—'}</td>
                  <td className="py-1.5 pr-3 text-right">{fmtDur(s.session_duration_sec)}</td>
                  <td className="py-1.5 pr-3 text-right">{fmtBytes(s.sent_bytes)}</td>
                  <td className="py-1.5 text-right">{fmtBytes(s.recv_bytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top IPs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-4">Top Source IPs</h3>
          <IPBar data={srcIPs} color="#3b82f6" />
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-4">Top Destination IPs</h3>
          <IPBar data={dstIPs} color="#10b981" />
        </div>
      </div>

    </div>
  )
}
