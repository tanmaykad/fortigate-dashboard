import { useState, useEffect } from 'react'
import { useFilters } from '../context/FilterContext'
import { Filter, RotateCcw, Calendar, X } from 'lucide-react'

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
      text-sm
      text-white
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
      text-sm
      text-white
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
  const [range, setRange] = useState('custom')

  const [draftFilters, setDraftFilters] = useState(filters)

  useEffect(() => {
    setDraftFilters(filters)
  }, [filters])

  const set = key => value =>
    setDraftFilters(prev => ({
      ...prev,
      [key]: value,
    }))

const normalizeTime = (value) => {
  if (!value) return "";

  const parts = value.trim().split(/[\s:]+/);

  // Handles "9 30" or "09 30"
  if (parts.length === 2) {
    const h = String(parseInt(parts[0], 10));
    const m = parts[1].padStart(2, "0");
    return `${h}:${m}`;
  }

  // Handles "930" or "1430"
  const digits = value.replace(/\D/g, "");

  if (digits.length === 3) {
    return `${parseInt(digits[0])}:${digits.slice(1)}`;
  }

  if (digits.length === 4) {
    const h = parseInt(digits.slice(0, 2), 10);
return `${h}:${digits.slice(2)}`;
  }

  return value;
};

const convertTo24Hour = (time, period) => {
  if (!time) return "";

  let [hour, minute] = time.split(":").map(Number);

  if (period === "PM" && hour < 12)
    hour += 12;

  if (period === "AM" && hour === 12)
    hour = 0;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const applyFilters = () => {
  const timeRegex = /^(0?[1-9]|1[0-2]):([0-5]\d)$/;

  if (
    (draftFilters.start_time &&
      !timeRegex.test(draftFilters.start_time)) ||
    (draftFilters.end_time &&
      !timeRegex.test(draftFilters.end_time))
  ) {
    alert("Please enter time in HH:mm format.");
    return;
  }

setFilters(draftFilters);
};

const clearFilters = () => {
const empty = {
  start_date: '',
  start_time: '',
  start_period: 'AM',

  end_date: '',
  end_time: '',
  end_period: 'AM',

  event_type: '',
  severity: '',
  src_ip: '',
  dst_ip: '',
  protocol: '',
}

    setDraftFilters(empty)
    resetFilters()
    setRange('custom')
  }

  const quickRanges = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 24h', value: '24h' },
    { label: 'Last 7d', value: '7d' },
    { label: 'Last 30d', value: '30d' },
    { label: 'Custom', value: 'custom' },
  ]

if (!open) {
  return (
    <button
      onClick={() => setOpen(true)}
className="
w-12
bg-slate-800
border-l
border-slate-700
flex
items-center
justify-center
text-gray-400
hover:text-white
hover:bg-slate-700
transition-all
cursor-pointer
"
      title="Open Filters"
    >
      <Filter size={18} />
    </button>
  )
}

  return (
    <aside className="w-[420px] bg-slate-800 border-l border-slate-700 flex flex-col flex-shrink-0">

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
  className="
    text-gray-400
    hover:text-white
    transition-colors
    p-1
    rounded
    hover:bg-slate-700
  "
  title="Close Filters"
>
  <X size={18} />
</button>

      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              {/* Quick Range */}

        <div>

          <Label>Quick Range</Label>

          <div className="grid grid-cols-2 gap-2">

            {quickRanges.map(btn => (

              <button
                key={btn.value}
                type="button"
                onClick={() => {
  setRange(btn.value)

  const now = new Date()

  const formatDate = (d) =>
    d.toISOString().split('T')[0]

const formatTime12 = (d) => {
  let hour = d.getHours();
  const minute = String(d.getMinutes()).padStart(2, "0");

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return {
    time: `${hour}:${minute}`,
    period,
  };
};

  let start = new Date(now)
  let end = new Date(now)

  switch (btn.value) {

    case 'today':
      start.setHours(0, 0, 0, 0)
      break

    case 'yesterday':
      start.setDate(start.getDate() - 1)
      end.setDate(end.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 0, 0)
      break

    case '24h':
      start.setHours(start.getHours() - 24)
      break

    case '7d':
      start.setDate(start.getDate() - 7)
      break

    case '30d':
      start.setDate(start.getDate() - 30)
      break

    default:
      return
  }

const start12 = formatTime12(start);
const end12 = formatTime12(end);

setDraftFilters(prev => ({
  ...prev,

  start_date: formatDate(start),
  start_time: start12.time,
  start_period: start12.period,

  end_date: formatDate(end),
  end_time: end12.time,
  end_period: end12.period,
}));
}}
                className={`rounded-lg py-2 text-xs font-medium transition-all ${
                  range === btn.value
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/40'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {btn.label}
              </button>

            ))}

          </div>

        </div>

        {range === 'custom' && (
          <>

            <div className="space-y-5">

  {/* FROM */}
  <div>
    <Label className="uppercase text-xs text-gray-400 font-semibold">
      From
    </Label>

    <div className="grid grid-cols-[2fr_2fr] gap-2">

      <Input
        type="date"
        value={draftFilters.start_date}
        onChange={set("start_date")}
      />

<div className="grid grid-cols-[3fr_70px] gap-2">

  <Input
    type="text"
    placeholder="9:30"
    maxLength={5}
    value={draftFilters.start_time || ""}
    onChange={(value) => set("start_time")(value)}
    onBlur={(e) =>
      set("start_time")(normalizeTime(e.target.value))
    }
  />

  <Select
    value={draftFilters.start_period || "AM"}
    onChange={set("start_period")}
  >
    <option value="AM">AM</option>
    <option value="PM">PM</option>
  </Select>

</div>

    </div>
  </div>

  {/* TO */}
  <div>
    <Label className="uppercase text-xs text-gray-400 font-semibold">
      To
    </Label>

    <div className="grid grid-cols-[2fr_2fr] gap-2">

      <Input
        type="date"
        value={draftFilters.end_date}
        onChange={set("end_date")}
      />

<div className="grid grid-cols-[3fr_70px] gap-2">

  <Input
    type="text"
    placeholder="9:30"
    maxLength={5}
    value={draftFilters.end_time || ""}
    onChange={(value) => set("end_time")(value)}
    onBlur={(e) =>
      set("end_time")(normalizeTime(e.target.value))
    }
  />

  <Select
    value={draftFilters.end_period || "AM"}
    onChange={set("end_period")}
  >
    <option value="AM">AM</option>
    <option value="PM">PM</option>
  </Select>

</div>

    </div>
  </div>

</div>
          </>
        )}
                {/* Event Type */}

        <div>

          <Label>Event Type</Label>

          <Select
            value={draftFilters.event_type}
            onChange={set('event_type')}
          >
            <option value="">All</option>
            <option value="traffic">Traffic</option>
            <option value="utm">UTM</option>
            <option value="event">Event</option>
          </Select>

        </div>

        {/* Severity */}

        <div>

          <Label>Severity</Label>

          <Select
            value={draftFilters.severity}
            onChange={set('severity')}
          >
            <option value="">All</option>
            <option value="notice">Notice</option>
            <option value="information">Information</option>
            <option value="warning">Warning</option>
          </Select>

        </div>

        {/* Source IP */}

        <div>

          <Label>Source IP</Label>

          <Input
            type="text"
            placeholder="192.168.1.x"
            value={draftFilters.src_ip}
            onChange={set('src_ip')}
          />

        </div>

        {/* Destination IP */}

        <div>

          <Label>Destination IP</Label>

          <Input
            type="text"
            placeholder="8.8.8.8"
            value={draftFilters.dst_ip}
            onChange={set('dst_ip')}
          />

        </div>

        {/* Protocol */}

        <div>

          <Label>Protocol</Label>

          <Select
            value={draftFilters.protocol}
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

      <div className="
    sticky
    bottom-0
    bg-slate-800
    p-5
    border-t
    border-slate-700
    space-y-3
">

        <button
          type="button"
          onClick={applyFilters}
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            py-3
            rounded-lg
            bg-green-600
            hover:bg-green-500
            text-white
            text-sm
            font-medium
            transition-all
duration-200
hover:scale-[1.02]
active:scale-[0.98]
          "
        >
          <Calendar size={15} />
          Apply Filters
        </button>

        <button
          type="button"
          onClick={clearFilters}
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            py-3
            rounded-lg
            bg-blue-600
            hover:bg-blue-500
            text-white
            text-sm
            font-medium
            transition-all
          "
        >
          <RotateCcw size={15} />
          Reset Filters
        </button>

      </div>
          </aside>
  )
}