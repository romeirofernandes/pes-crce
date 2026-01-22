import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/manage-tournament-crce" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
