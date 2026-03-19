import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainWindow from './Principal'
import LoginWindow from './Login'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginWindow />} />
        <Route path="/dashboard/*" element={<MainWindow />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<MainWindow />} />
        <Route path="/campanas" element={<MainWindow />} />
        <Route path="/ventas" element={<MainWindow />} />
        <Route path="/configuracion" element={<MainWindow />} />
      </Routes>
    </Router>
  )
}

export default App