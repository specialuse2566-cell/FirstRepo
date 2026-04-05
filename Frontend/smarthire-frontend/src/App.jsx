import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import CandidateDashboard from './pages/CandidateDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import Landing from './pages/Landing'

function roleHome(role) {
  return role === 'RECRUITER' ? '/recruiter' : '/candidate';
}

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={roleHome(user.role)} />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/candidate" element={
        <ProtectedRoute requiredRole="CANDIDATE">
          <CandidateDashboard />
        </ProtectedRoute>
      } />
      <Route path="/recruiter" element={
        <ProtectedRoute requiredRole="RECRUITER">
          <RecruiterDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
