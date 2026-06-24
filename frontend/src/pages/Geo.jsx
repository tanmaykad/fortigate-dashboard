import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useFilters } from '../context/FilterContext'
import { getSrcCountries, getDstCountries, getGeoFlows } from '../api/client'

const TT = { contentStyle:{ backgroundColor:'#1f2937', border:'1px solid #374151', borderRadius:'6px' }, labelStyle:{ color:'#f9fafb' } }

export default function Geo() {
  const { filters }  = useFilters()
  const [src,   setSrc]   = useState([])
  const [dst,   setDst]   = useState([])
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getSrcCountries(filters),
      getDstCountries(filters),
      getGeoFlows(filters),
    ]).then(([s, d, f]) => {
      setSrc(s.data); setDst(d.data); setFlows(f.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [filters])

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Geographic Distribution</h2>

      {/* Country charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[
          { label:'Source Countries',      data:src, color:'#3b82f6' },
          { label:'Destination Countries', data:dst, color:'#10b981' },
        ].map(({ label, data, color }) => (
          <div key={label} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-4">{label}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.slice(0,8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill:'#9ca3af', fontSize:11 }} />
                <YAxis type="category" dataKey="country" width={70} tick={{ fill:'#9ca3af', fontSize:11 }} />
                <Tooltip {...TT} />
                <Bar dataKey="count" fill={color} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Flows table */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-3">Traffic Flows (Source → Destination)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-300">
            <thead>
              <tr className="text-gray-500 border-b border-gray-700 text-left">
                <th className="py-2 pr-4 w-8">#</th>
                <th className="py-2 pr-8">Source Country</th>
                <th className="py-2 pr-8">Destination Country</th>
                <th className="py-2 text-right">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((f, i) => (
                <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-1.5 pr-4 text-gray-500">{i+1}</td>
                  <td className="py-1.5 pr-8">{f.src_country}</td>
                  <td className="py-1.5 pr-8">{f.dst_country}</td>
                  <td className="py-1.5 text-right">{f.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
