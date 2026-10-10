/**
 * ProtectedRoute
 *
 * Reads `isAuthenticated` from the global auth store and redirects
 * unauthenticated visitors to `/login`, preserving the attempted URL
 * in `location.state.from` so LoginPage can redirect back after sign-in.
 *
 * Usage (in router/index.tsx):
 *   { element: <ProtectedRoute />, children: [...] }
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // Preserve the attempted URL so LoginPage can redirect back after sign-in
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
