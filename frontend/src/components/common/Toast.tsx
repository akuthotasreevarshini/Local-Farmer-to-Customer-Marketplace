import { useEffect, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  /** Auto-dismiss duration in ms (default: 4000; 0 = no auto-dismiss) */
  duration?: number
}

interface ToastItemProps extends ToastMessage {
  onDismiss: (id: string) => void
}

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 size={20} aria-hidden="true" />,
  error: <XCircle size={20} aria-hidden="true" />,
  info: <Info size={20} aria-hidden="true" />,
  warning: <AlertCircle size={20} aria-hidden="true" />,
}

const STYLES: Record<ToastVariant, string> = {
  success: 'bg-[#2D6A2D] text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-[#8B5E3C] text-white',
}

function ToastItem({
  id,
  variant,
  title,
  description,
  duration = 4000,
  onDismiss,
}: ToastItemProps) {
  useEffect(() => {
    if (duration === 0) return
    const timer = setTimeout(() => onDismiss(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex w-full max-w-sm items-start gap-3 rounded-lg px-4 py-3 shadow-lg ${STYLES[variant]}`}
    >
      <span className="mt-0.5 shrink-0">{ICONS[variant]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium leading-tight">{title}</p>
        {description && (
          <p className="mt-0.5 text-sm opacity-90">{description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 rounded-full p-0.5 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Dismiss notification"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

/**
 * Toast container — place once at the root of your app.
 * Manages the stacking and positioning of all active toasts.
 */
export default function ToastContainer({
  toasts,
  onDismiss,
}: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
