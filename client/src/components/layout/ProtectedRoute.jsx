import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="loading-ring mx-auto mb-4" />
          <div className="text-gray-400 font-mono text-sm">Validating credentials...</div>
        </div>
      </div>
    )
  }

  if (!user) {

    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
