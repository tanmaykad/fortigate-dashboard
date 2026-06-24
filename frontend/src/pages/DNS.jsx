import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useFilters } from '../context/FilterContext'
import { getTopDomains, getDNSQueryTypes, getDNSBySource, getDNSOverTime } from '../api/client'

const TT = { contentStyle:{ backgroundColor:'#1f2937', border:'1px solid #374151', borderRadius:'6px' }, labelStyle:{ color:'#f9fafb' } }

export default function DNS() {
  const { filters }   = useFilters()
  const [domains,     setDomains]    = useState([])
  const [queryTypes,  setQueryTypes] = useState([])
  const [bySource,    setBySource]   = useState([])
  const [overTime,    setOverTime]   = useState([])
  const [loading,     setLoading]    = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTopDomains(filters, 20),
      getDNSQueryTypes(filters),
      getDNSBySource(filters),
      getDNSOverTime(filters, 'hour'),
    ]).then(([d, qt, src, ot]) => {
      setDomains(d.data); setQueryTypes(qt.data)
      setBySource(src.data); setOverTime(ot.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [filters])

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">DNS Analytics</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Query types */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-4">Query Type Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={queryTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="query_type" tick={{ fill:'#9ca3af', fontSize:11 }} />
              <YAxis tick={{ fill:'#9ca3af', fontSize:11 }} />
              <Tooltip {...TT} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By source IP */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-4">DNS Queries by Source IP</h3>
          <div className="space-y-2 mt-2">
            {bySource.map((d, i) => (
              <div key={d.src_ip} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4 text-right">{i+1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs font-mono text-gray-300">{d.src_ip}</span>
                    <span className="text-xs text-gray-400">{d.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1 bg-gray-700 rounded">
                    <div className="h-1 bg-purple-500 rounded"
                      style={{ width:`${(d.count/bySource[0].count)*100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Over time */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-4">DNS Events Over Time (Hourly)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={overTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time_bucket" tick={{ fill:'#9ca3af', fontSize:10 }} />
            <YAxis tick={{ fill:'#9ca3af', fontSize:11 }} />
            <Tooltip {...TT} />
            <Line type="monotone" dataKey="count" stroke="#8b5cf6" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top domains table */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-3">Top Queried Domains</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-300">
            <thead>
              <tr className="text-gray-500 border-b border-gray-700 text-left">
                <th className="py-2 pr-4 w-8">#</th>
                <th className="py-2 pr-4">Domain</th>
                <th className="py-2 text-right">Queries</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d, i) => (
                <tr key={d.domain} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-1.5 pr-4 text-gray-500">{i+1}</td>
                  <td className="py-1.5 pr-4 font-mono">{d.domain}</td>
                  <td className="py-1.5 text-right">{d.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
