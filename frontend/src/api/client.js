import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

// Strip empty values from filter object before sending as query params

const convertTo24Hour = (time, period) => {
  if (!time) return "";

  let [hour, minute] = time.split(":").map(Number);

  if (period === "PM" && hour < 12)
    hour += 12;

  if (period === "AM" && hour === 12)
    hour = 0;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const p = (filters = {}, extra = {}) => {
  const params = { ...extra };

  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') {
      params[k] = v;
    }
  });

  if (params.start_time) {
    params.start_time = convertTo24Hour(
      params.start_time,
      params.start_period
    );
  }

  if (params.end_time) {
    params.end_time = convertTo24Hour(
      params.end_time,
      params.end_period
    );
  }

  delete params.start_period;
  delete params.end_period;

  return { params };
};

// ── Summary ────────────────────────────────────────────────────────────────────
export const getSummaryKPIs         = f           => api.get('/api/summary/kpis',                p(f))
export const getEventsOverTime      = (f, g='day')=> api.get('/api/summary/events-over-time',    p(f,{granularity:g}))
export const getSeverityBreakdown   = f           => api.get('/api/summary/severity-breakdown',  p(f))
export const getEventTypeBreakdown  = f           => api.get('/api/summary/event-type-breakdown',p(f))

// ── Traffic ────────────────────────────────────────────────────────────────────
export const getProtocols    = f                   => api.get('/api/traffic/protocols',     p(f))
export const getTopApps      = (f, limit=10)       => api.get('/api/traffic/top-apps',      p(f,{limit}))
export const getBytesOverTime= (f, g='day')        => api.get('/api/traffic/bytes-over-time',p(f,{granularity:g}))
export const getTopSessions  = (f, sort='duration')=> api.get('/api/traffic/top-sessions',  p(f,{sort_by:sort}))
export const getTopSourceIPs = (f, limit=10)       => api.get('/api/traffic/top-source-ips',p(f,{limit}))
export const getTopDestIPs   = (f, limit=10)       => api.get('/api/traffic/top-dest-ips',  p(f,{limit}))

// ── Threats ────────────────────────────────────────────────────────────────────
export const getThreatEvents   = (f, page=1, ps=20)=> api.get('/api/threats/events',           p(f,{page,page_size:ps}))
export const getThreatsByApp   = f                  => api.get('/api/threats/by-app',           p(f))
export const getThreatsTimeline= (f, g='day')       => api.get('/api/threats/timeline',         p(f,{granularity:g}))

// ── DNS ────────────────────────────────────────────────────────────────────────
export const getTopDomains    = (f, limit=20) => api.get('/api/dns/top-domains',   p(f,{limit}))
export const getDNSQueryTypes = f             => api.get('/api/dns/query-types',   p(f))
export const getDNSBySource   = f             => api.get('/api/dns/by-source-ip',  p(f))
export const getDNSOverTime   = (f, g='hour') => api.get('/api/dns/over-time',     p(f,{granularity:g}))

// ── Geo ────────────────────────────────────────────────────────────────────────
export const getSrcCountries = f => api.get('/api/geo/src-countries', p(f))
export const getDstCountries = f => api.get('/api/geo/dst-countries', p(f))
export const getGeoFlows     = f => api.get('/api/geo/flows',         p(f))
