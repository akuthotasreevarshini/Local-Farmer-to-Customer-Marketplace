/**
 * ForbiddenPage — 403 Forbidden
 *
 * Rendered by RoleGuard when the authenticated user's role does not
 * satisfy the required role for a route.
 */
import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FAF3E0] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <ShieldOff
          size={56}
          className="mx-auto mb-4 text-[#2D6A2D] opacity-70"
          aria-hidden="true"
        />
        <h1 className="text-5xl font-bold text-[#2D6A2D] mb-3">403</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Forbidden</h2>
        <p className="text-gray-500 mb-8">
          You don't have permission to view this page. Contact your administrator
          if you believe this is a mistake.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-[#2D6A2D] text-[#2D6A2D] px-6 py-2 text-sm font-medium hover:bg-[#2D6A2D] hover:text-white transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="rounded-full bg-[#2D6A2D] text-white px-6 py-2 text-sm font-medium hover:bg-[#245424] transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
