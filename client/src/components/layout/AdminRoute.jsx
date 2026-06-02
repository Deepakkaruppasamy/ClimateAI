import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070a13] text-white font-mono text-sm">
        Verifying administrative authorization...
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    console.warn(`🔒 Access Denied: User role ${user?.role || 'none'} attempted to access Admin Panel.`)
    return <Navigate to="/dashboard" state={{ from: location }} replace />
  }

  return children
}
