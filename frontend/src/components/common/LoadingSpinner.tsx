interface LoadingSpinnerProps {
  /** Size in pixels (default: 40) */
  size?: number
  /** Accessible label (default: "Loading…") */
  label?: string
  /** Additional CSS classes */
  className?: string
}

export default function LoadingSpinner({
  size = 40,
  label = 'Loading…',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`flex items-center justify-center ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="#2D6A2D"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80"
          strokeDashoffset="60"
          opacity="0.25"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="#5DAB24"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80"
          strokeDashoffset="60"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}
