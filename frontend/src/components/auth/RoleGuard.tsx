/**
 * RoleGuard
 *
 * Reads the authenticated user's role from the global auth store.
 * If the role does not match `requiredRole`, renders the ForbiddenPage (403).
 * Otherwise renders the child routes via <Outlet />.
 *
 * Must be nested inside a <ProtectedRoute /> so `user` is guaranteed to exist
 * when this component renders.
 *
 * Usage (in router/index.tsx):
 *   { element: <RoleGuard requiredRole="farmer" />, children: [...] }
 */
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import ForbiddenPage from '../../pages/ForbiddenPage'

export type UserRole = 'customer' | 'farmer' | 'admin'

interface RoleGuardProps {
  /** The role required to access the child routes. */
  requiredRole: UserRole
}

export default function RoleGuard({ requiredRole }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user)

  // user will be non-null here because ProtectedRoute gates this component,
  // but we guard defensively in case of direct use
  if (!user || user.role !== requiredRole) {
    return <ForbiddenPage />
  }

  return <Outlet />
}
