import { useState } from 'react'
import { useFilters } from '../context/FilterContext'
import { Filter, Calendar, RotateCcw } from 'lucide-react'

const Label = ({ children }) => (
  <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
    {children}
  </p>
)

const Input = ({ value, onChange, ...rest }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    className="
      w-full
      bg-slate-700
      border border-slate-600
      rounded-lg
      px-3 py-2
      text-sm text-white
      placeholder-gray-500
      transition-all
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500/30
      focus:border-blue-500
    "
    {...rest}
  />
)

const Select = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="
      w-full
      bg-slate-700
      border border-slate-600
      rounded-lg
      px-3 py-2
      text-sm text-white
      transition-all
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500/30
      focus:border-blue-500
    "
  >
    {children}
  </select>
)

export default function FilterPanel() {
  const { filters, setFilters, resetFilters } = useFilters()
  const [open, setOpen] = useState(true)

  const set = (key) => (val) =>
    setFilters(prev => ({ ...prev, [key]: val }))

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="
          w-8
          bg-slate-800
          border-l border-slate-700
          flex items-center justify-center
          text-gray-500 hover:text-white
          transition-colors
        "
        title="Open Filters"
      >
        ◀
      </button>
    )
  }

  return (
    <aside className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col flex-shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-blue-400" />
          <span className="text-base font-semibold text-white">
            Filters
          </span>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="text-gray-500 hover:text-white transition-colors"
          title="Collapse"
        >
          ▶
        </button>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={filters.start_date}
            onChange={set('start_date')}
          />
        </div>

        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={filters.end_date}
            onChange={set('end_date')}
          />
        </div>

        <div>
          <Label>Event Type</Label>
          <Select
            value={filters.event_type}
            onChange={set('event_type')}
          >
            <option value="">All</option>
            <option value="traffic">Traffic</option>
            <option value="utm">UTM</option>
            <option value="event">Event</option>
          </Select>
        </div>

        <div>
          <Label>Severity</Label>
          <Select
            value={filters.severity}
            onChange={set('severity')}
          >
            <option value="">All</option>
            <option value="notice">Notice</option>
            <option value="information">Information</option>
            <option value="warning">Warning</option>
          </Select>
        </div>

        <div>
          <Label>Source IP</Label>
          <Input
            type="text"
            placeholder="192.168.1.x"
            value={filters.src_ip}
            onChange={set('src_ip')}
          />
        </div>

        <div>
          <Label>Destination IP</Label>
          <Input
            type="text"
            placeholder="8.8.8.8"
            value={filters.dst_ip}
            onChange={set('dst_ip')}
          />
        </div>

        <div>
          <Label>Protocol</Label>
          <Select
            value={filters.protocol}
            onChange={set('protocol')}
          >
            <option value="">All</option>
            <option value="6">TCP</option>
            <option value="17">UDP</option>
            <option value="1">ICMP</option>
          </Select>
        </div>

      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-700">
        <button
          onClick={resetFilters}
          className="
            w-full
            flex items-center justify-center gap-2
            py-3
            rounded-lg
            bg-blue-600
            hover:bg-blue-500
            text-white
            text-sm
            font-medium
            transition-all
            shadow-lg shadow-blue-900/30
          "
        >
          <RotateCcw size={14} />
          Reset Filters
        </button>
      </div>

    </aside>
  )
}