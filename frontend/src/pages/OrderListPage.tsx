import { useEffect, useState, useCallback } from 'react'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import type { Order } from '../api/types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700', confirmed: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-yellow-100 text-yellow-700', dispatched: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
}

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get<{ success: boolean; data: { orders: Order[] } }>('/api/orders')
      setOrders(data.data.orders)
    } catch { setError('Failed to load orders.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void fetchOrders() }, [fetchOrders])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList size={28} className="text-[#2D6A2D]" />
          <h1 className="text-2xl font-bold text-[#2D6A2D]">My Orders</h1>
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">{error}</div>}
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Place your first order to see it here."
            action={<Link to="/products" className="rounded-full bg-[#2D6A2D] text-white px-6 py-2 text-sm">Shop Now</Link>} />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order._id} to={`/orders/${order._id}`} className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-gray-500">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''} · ₹{order.grandTotal.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <ChevronRight size={18} className="text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
