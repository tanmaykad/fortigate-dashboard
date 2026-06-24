import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Summary  from './pages/Summary'
import Traffic  from './pages/Traffic'
import Threats  from './pages/Threats'
import DNS      from './pages/DNS'
import Geo      from './pages/Geo'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"        element={<Summary />}  />
        <Route path="/traffic" element={<Traffic />}  />
        <Route path="/threats" element={<Threats />}  />
        <Route path="/dns"     element={<DNS />}      />
        <Route path="/geo"     element={<Geo />}      />
      </Routes>
    </Layout>
  )
}
