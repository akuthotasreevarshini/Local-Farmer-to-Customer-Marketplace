/**
 * LoginPage
 *
 * - Form: email + password
 * - Calls POST /api/auth/login
 * - On success: stores user + accessToken in useAuthStore, redirects to intended URL or '/'
 * - HTTP 401: shows inline "Invalid email or password" error
 * - Link to /register
 */
import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogIn, Eye, EyeOff, Leaf } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import { useAuthStore, type User } from '../stores/useAuthStore'
import LoadingSpinner from '../components/common/LoadingSpinner'

interface LoginResponse {
  success: boolean
  data: {
    user: User
    accessToken: string
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Where to redirect after successful login
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data } = await axiosInstance.post<LoginResponse>(
        '/api/auth/login',
        { email, password },
        { withCredentials: true },
      )

      login(data.data.user, data.data.accessToken)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        setError('Invalid email or password.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF3E0] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <Leaf size={28} className="text-[#2D6A2D]" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-[#2D6A2D]">Welcome back</h1>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to your FarmConnect account.
          </p>

          {/* Inline error */}
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm
                           focus:border-[#2D6A2D] focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]
                           disabled:opacity-50"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm
                             focus:border-[#2D6A2D] focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]
                             disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400
                             hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2D6A2D] px-4 py-2.5
                         text-sm font-semibold text-white transition-colors
                         hover:bg-[#245424] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoadingSpinner size={18} label="Signing in…" />
              ) : (
                <>
                  <LogIn size={16} aria-hidden="true" />
                  Sign in
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-[#2D6A2D] hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
