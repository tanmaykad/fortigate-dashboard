import { createContext, useContext, useState } from 'react'

const FilterContext = createContext(null)

const EMPTY = {
  start_date: '', end_date: '',
  event_type: '', severity: '',
  src_ip: '',     dst_ip: '',
  protocol: '',
}

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(EMPTY)
  const resetFilters = () => setFilters(EMPTY)
  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  )
}

export const useFilters = () => useContext(FilterContext)
