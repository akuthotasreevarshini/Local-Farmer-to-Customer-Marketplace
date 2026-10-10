import { PackageOpen } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  /** Icon to display (defaults to a box icon) */
  icon?: ReactNode
  /** Heading text */
  title: string
  /** Optional description */
  description?: string
  /** Optional call-to-action element */
  action?: ReactNode
  /** Additional CSS classes */
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-16 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF3E0] text-[#2D6A2D]">
        {icon ?? <PackageOpen size={32} aria-hidden="true" />}
      </div>
      <div className="max-w-sm">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
