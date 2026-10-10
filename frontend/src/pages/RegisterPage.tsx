/**
 * RegisterPage
 *
 * - Form: name, email, password, role (Customer | Farmer)
 * - Client-side password complexity: 8+ chars, uppercase, lowercase, digit, special char
 * - Calls POST /api/auth/register
 * - HTTP 400: shows inline field-level errors from response
 * - HTTP 409: shows "Email already in use" inline
 * - On success: stores user + accessToken in useAuthStore, redirects to '/'
 * - Link to /login
 */
import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, Leaf, CheckCircle2, XCircle } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import { useAuthStore, type User } from '../stores/useAuthStore'
import LoadingSpinner from '../components/common/LoadingSpinner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RegisterResponse {
  success: boolean
  data: {
    user: User
    accessToken: string
  }
}

interface ApiError {
  response?: {
    status?: number
    data?: {
      message?: string
      errors?: Record<string, string>
    }
  }
}

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  role?: string
  general?: string
}

// ---------------------------------------------------------------------------
// Password complexity rules
// ---------------------------------------------------------------------------
const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One digit',           test: (p: string) => /\d/.test(p) },
  { label: 'One special character (e.g. !@#$%)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

function validatePassword(password: string): string | null {
  const failed = PASSWORD_RULES.filter((r) => !r.test(password))
  if (failed.length === 0) return null
  return `Password must include: ${failed.map((r) => r.label.toLowerCase()).join(', ')}.`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'farmer'>('customer')
  const [showPassword, setShowPassword] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
    setShowRules(true)
    // Clear previous password error while typing
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }))
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errors: FieldErrors = {}

    // Client-side validation
    if (!name.trim()) errors.name = 'Name is required.'
    if (!email.trim()) errors.email = 'Email is required.'
    const pwError = validatePassword(password)
    if (pwError) errors.password = pwError

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      const { data } = await axiosInstance.post<RegisterResponse>(
        '/api/auth/register',
        { name: name.trim(), email: email.trim(), password, role },
        { withCredentials: true },
      )

      login(data.data.user, data.data.accessToken)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const apiErr = err as ApiError
      const status = apiErr.response?.status

      if (status === 409) {
        setFieldErrors({ email: 'Email already in use. Try logging in instead.' })
      } else if (status === 400) {
        // Field-level errors from Zod / express-validator
        const serverErrors = apiErr.response?.data?.errors
        if (serverErrors && typeof serverErrors === 'object') {
          setFieldErrors(serverErrors as FieldErrors)
        } else {
          setFieldErrors({ general: apiErr.response?.data?.message ?? 'Please check your details.' })
        }
      } else {
        setFieldErrors({ general: 'Something went wrong. Please try again.' })
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
            <h1 className="text-2xl font-bold text-[#2D6A2D]">Create account</h1>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Join FarmConnect — buy fresh produce directly from local farmers.
          </p>

          {/* General error */}
          {fieldErrors.general && (
            <div
              role="alert"
              className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {fieldErrors.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                aria-invalid={!!fieldErrors.name}
                className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm
                            focus:outline-none focus:ring-1 disabled:opacity-50
                            ${fieldErrors.name
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                              : 'border-gray-300 focus:border-[#2D6A2D] focus:ring-[#2D6A2D]'}`}
                placeholder="Jane Doe"
                disabled={loading}
              />
              {fieldErrors.name && (
                <p id="name-error" role="alert" className="mt-1 text-xs text-red-600">
                  {fieldErrors.name}
                </p>
              )}
            </div>

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
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                aria-invalid={!!fieldErrors.email}
                className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm
                            focus:outline-none focus:ring-1 disabled:opacity-50
                            ${fieldErrors.email
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                              : 'border-gray-300 focus:border-[#2D6A2D] focus:ring-[#2D6A2D]'}`}
                placeholder="you@example.com"
                disabled={loading}
              />
              {fieldErrors.email && (
                <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
                  {fieldErrors.email}
                </p>
              )}
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onFocus={() => setShowRules(true)}
                  aria-describedby="password-rules"
                  aria-invalid={!!fieldErrors.password}
                  className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm shadow-sm
                              focus:outline-none focus:ring-1 disabled:opacity-50
                              ${fieldErrors.password
                                ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                                : 'border-gray-300 focus:border-[#2D6A2D] focus:ring-[#2D6A2D]'}`}
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
                  {showPassword
                    ? <EyeOff size={16} aria-hidden="true" />
                    : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>

              {/* Password complexity checker */}
              {showRules && (
                <ul id="password-rules" className="mt-2 space-y-1" aria-label="Password requirements">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password)
                    return (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs ${
                          passed ? 'text-[#2D6A2D]' : 'text-gray-400'
                        }`}
                      >
                        {passed
                          ? <CheckCircle2 size={12} aria-hidden="true" />
                          : <XCircle size={12} aria-hidden="true" />}
                        {rule.label}
                      </li>
                    )
                  })}
                </ul>
              )}

              {fieldErrors.password && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Role selector */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                I am a…
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { value: 'customer', label: 'Customer', description: 'Buy fresh produce' },
                    { value: 'farmer',   label: 'Farmer',   description: 'Sell my harvest' },
                  ] as const
                ).map(({ value, label, description }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer flex-col rounded-lg border-2 px-4 py-3 transition-colors
                                ${role === value
                                  ? 'border-[#2D6A2D] bg-[#2D6A2D]/5'
                                  : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                    <span className="text-xs text-gray-500">{description}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.role && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {fieldErrors.role}
                </p>
              )}
            </fieldset>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2D6A2D] px-4 py-2.5
                         text-sm font-semibold text-white transition-colors
                         hover:bg-[#245424] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoadingSpinner size={18} label="Creating account…" />
              ) : (
                <>
                  <UserPlus size={16} aria-hidden="true" />
                  Create account
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-[#2D6A2D] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
