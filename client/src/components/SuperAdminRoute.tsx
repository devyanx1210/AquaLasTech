// SuperAdminRoute - route guard that blocks non-super_admin users
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Blocks non-super_admins from accessing wrapped routes
// Usage: wrap <Route path="/admin/settings"> with this
export default function SuperAdminRoute() {
    const { user, loading } = useAuth()

    if (loading) return null // wait for auth to resolve

    return user?.role === 'super_admin'
        ? <Outlet />
        : <Navigate to="/admin/dashboard" replace />
}