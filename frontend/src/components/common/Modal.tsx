import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  /** Controls visibility */
  isOpen: boolean
  /** Called when the modal should close */
  onClose: () => void
  /** Modal heading */
  title: string
  /** Modal body content */
  children: ReactNode
  /** Footer slot (e.g. action buttons) */
  footer?: ReactNode
  /** Max width class (default: max-w-md) */
  maxWidth?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Sync native <dialog> open state
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (isOpen && !el.open) el.showModal()
    if (!isOpen && el.open) el.close()
  }, [isOpen])

  // Close on Escape (native dialog handles it, but we sync state)
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const handleCancel = () => onClose()
    el.addEventListener('cancel', handleCancel)
    return () => el.removeEventListener('cancel', handleCancel)
  }, [onClose])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={`${maxWidth} w-full rounded-xl p-0 shadow-xl backdrop:bg-black/50 open:flex open:flex-col`}
      aria-labelledby="modal-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2
          id="modal-title"
          className="text-lg font-semibold text-gray-900"
        >
          {title}
        </h2>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A2D]"
          aria-label="Close modal"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          {footer}
        </div>
      )}
    </dialog>
  )
}
