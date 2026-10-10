import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import type { Order } from '../api/types'
import { useAuthStore } from '../stores/useAuthStore'
import LoadingSpinner from '../components/common/LoadingSpinner'

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700', confirmed: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-yellow-100 text-yellow-700', dispatched: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    axiosInstance.get<{ success: boolean; data: Order }>(`/api/orders/${id}`)
      .then((r) => setOrder(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  async function handleCancel() {
    if (!order || !confirm('Cancel this order?')) return
    setCancelling(true)
    try {
      await axiosInstance.post(`/api/orders/${order._id}/cancel`)
      setOrder((o) => o ? { ...o, status: 'cancelled' } : o)
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to cancel.')
    } finally { setCancelling(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>
  if (!order) return <div className="min-h-screen bg-[#FAF3E0] flex items-center justify-center"><p className="text-gray-500">Order not found.</p></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/orders" className="flex items-center gap-1 text-sm text-[#2D6A2D] hover:underline mb-6"><ArrowLeft size={14} />My Orders</Link>
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="font-bold text-xl text-gray-900">Order #{order._id.slice(-8).toUpperCase()}</h1>
            <span className={`text-sm font-medium px-3 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
          </div>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <Package size={16} className="text-gray-400 shrink-0" />
                <span className="flex-1 text-sm">{item.name} ×{item.quantity} ({item.unit})</span>
                <span className="text-sm font-medium">₹{(item.priceSnapshot * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-bold"><span>Total</span><span>₹{order.grandTotal.toFixed(2)}</span></div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
            <p>Placed: {new Date(order.createdAt).toLocaleString('en-IN')}</p>
            <p>Delivery to: {order.deliveryAddress.district}, {order.deliveryAddress.state}</p>
          </div>
          {/* Status timeline */}
          {order.statusHistory.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Status History</p>
              <div className="space-y-2">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[h.status] ?? 'bg-gray-100 text-gray-700'}`}>{h.status}</span>
                    <span>{new Date(h.changedAt).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {order.status === 'placed' && user?.role === 'customer' && (
            <button onClick={handleCancel} disabled={cancelling} className="text-sm text-red-600 hover:underline disabled:opacity-50">
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
