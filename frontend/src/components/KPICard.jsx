import {
  Activity,
  Globe,
  ShieldAlert,
  Server,
  Bell,
} from 'lucide-react'

const COLORS = {
  blue:   'text-blue-400',
  green:  'text-green-400',
  yellow: 'text-yellow-400',
  red:    'text-red-400',
  purple: 'text-purple-400',
}

const BORDERS = {
  blue:   'border-l-blue-500',
  green:  'border-l-green-500',
  yellow: 'border-l-yellow-500',
  red:    'border-l-red-500',
  purple: 'border-l-purple-500',
}

const ICONS = {
  blue: Activity,
  green: Globe,
  red: ShieldAlert,
  purple: Server,
  yellow: Bell,
}

export default function KPICard({ label, value, sub, color = 'blue' }) {
  const Icon = ICONS[color]
  return (
    <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 border-l-4 ${BORDERS[color]} hover:bg-gray-700 transition-all duration-300`}>
      <div className="flex items-center gap-2">
  <Icon className={`w-4 h-4 ${COLORS[color]}`} />
  <p className="text-sm text-gray-400 uppercase tracking-wide">
    {label}
  </p>
</div>
      <p className={`text-4xl font-bold mt-2 ${COLORS[color]}`}>
        {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
