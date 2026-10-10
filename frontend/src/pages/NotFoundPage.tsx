/**
 * NotFoundPage — 404 Not Found
 *
 * Rendered when no route matches the current URL.
 */
import { SearchX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FAF3E0] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <SearchX
          size={56}
          className="mx-auto mb-4 text-[#2D6A2D] opacity-70"
          aria-hidden="true"
        />
        <h1 className="text-5xl font-bold text-[#2D6A2D] mb-3">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
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
