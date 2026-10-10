import { useState, useCallback } from 'react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ErrorBoundary from './components/common/ErrorBoundary'
import LoadingSpinner from './components/common/LoadingSpinner'
import EmptyState from './components/common/EmptyState'
import Modal from './components/common/Modal'
import ToastContainer, { type ToastMessage } from './components/common/Toast'
import IconSmokeTest from './components/dev/IconSmokeTest'
import { Leaf } from 'lucide-react'

let toastCounter = 0

export default function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (msg: Omit<ToastMessage, 'id'>) => {
    setToasts((prev) => [...prev, { ...msg, id: String(++toastCounter) }])
  }

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1 p-6">
          {/* Design tokens swatch */}
          <section className="mb-8">
            <h1 className="mb-4 text-2xl font-bold text-[#2D6A2D]">
              FarmConnect â€” Design System
            </h1>
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'Forest Green', color: '#2D6A2D' },
                { name: 'Leaf Green', color: '#5DAB24' },
                { name: 'Warm Cream', color: '#FAF3E0', text: '#2D6A2D' },
                { name: 'Earthy Brown', color: '#8B5E3C' },
              ].map(({ name, color, text = 'white' }) => (
                <div
                  key={name}
                  className="flex h-16 w-36 items-center justify-center rounded-lg text-xs font-medium shadow"
                  style={{ backgroundColor: color, color: text }}
                >
                  <div className="text-center">
                    <div>{name}</div>
                    <div className="opacity-75">{color}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Icon smoke test */}
          <IconSmokeTest />

          {/* Common components demo */}
          <section className="mt-8 space-y-6">
            <h2 className="text-xl font-bold text-[#2D6A2D]">Common Components</h2>

            {/* Spinner */}
            <div className="flex items-center gap-4">
              <LoadingSpinner size={32} />
              <LoadingSpinner size={48} />
              <LoadingSpinner size={64} />
              <span className="text-sm text-gray-600">LoadingSpinner</span>
            </div>

            {/* Empty State */}
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search for something else."
              action={
                <button className="rounded-full bg-[#2D6A2D] px-4 py-2 text-sm text-white">
                  Browse all products
                </button>
              }
            />

            {/* Modal trigger */}
            <div className="flex gap-3">
              <button
                onClick={() => setModalOpen(true)}
                className="rounded-lg bg-[#2D6A2D] px-4 py-2 text-sm text-white hover:bg-[#245424]"
              >
                Open Modal
              </button>

              <button
                onClick={() => addToast({ variant: 'success', title: 'Order placed!', description: 'Your order is being prepared.' })}
                className="rounded-lg bg-[#5DAB24] px-4 py-2 text-sm text-white hover:bg-[#4d9420]"
              >
                Success Toast
              </button>
              <button
                onClick={() => addToast({ variant: 'error', title: 'Payment failed', description: 'Please check your details.' })}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Error Toast
              </button>
              <button
                onClick={() => addToast({ variant: 'warning', title: 'Low stock', description: 'Only 2 units remaining.' })}
                className="rounded-lg bg-[#8B5E3C] px-4 py-2 text-sm text-white hover:bg-[#7a5234]"
              >
                Warning Toast
              </button>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm Action"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setModalOpen(false)
                addToast({ variant: 'success', title: 'Confirmed!' })
              }}
              className="rounded-lg bg-[#2D6A2D] px-4 py-2 text-sm text-white hover:bg-[#245424]"
            >
              Confirm
            </button>
          </>
        }
      >
        <div className="flex items-center gap-3 text-gray-700">
          <Leaf size={24} className="text-[#2D6A2D]" aria-hidden="true" />
          <p>This is a demo modal. Are you sure you want to continue?</p>
        </div>
      </Modal>

      {/* Toast container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ErrorBoundary>
  )
}

