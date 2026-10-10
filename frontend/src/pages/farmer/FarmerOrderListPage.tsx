import { useEffect, useState, useCallback } from 'react'
import { ClipboardList, ChevronDown } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import type { Order } from '../../api/types'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700', confirmed: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-yellow-100 text-yellow-700', dispatched: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
}
const NEXT_STATUS: Record<string, string> = { placed: 'confirmed', confirmed: 'packed', packed: 'dispatched', dispatched: 'delivered' }

export default function FarmerOrderListPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get<{ success: boolean; data: { orders: Order[] } }>('/api/orders/farmer/mine')
      setOrders(data.data.orders)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { void fetchOrders() }, [fetchOrders])

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setUpdating(order._id)
    try {
      await axiosInstance.put(`/api/orders/${order._id}/status`, { status: next })
      setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, status: next } : o))
    } catch { alert('Failed to update order status.') }
    finally { setUpdating(null) }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList size={28} className="text-[#2D6A2D]" />
          <h1 className="text-2xl font-bold text-[#2D6A2D]">Incoming Orders</h1>
        </div>
        {orders.length === 0 ? <EmptyState title="No orders yet" description="Orders from customers will appear here." /> : (
          <div className="space-y-3">
            {orders.map((order) => {
              const nextStatus = NEXT_STATUS[order.status]
              return (
                <div key={order._id} className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <span className="font-mono text-xs text-gray-500 block mb-1">#{order._id.slice(-8).toUpperCase()}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#2D6A2D]">₹{order.grandTotal.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    {order.items.map((item, i) => <span key={i}>{item.name} ×{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>)}
                  </div>
                  {nextStatus && (
                    <button onClick={() => advanceStatus(order)} disabled={updating === order._id}
                      className="mt-3 text-sm font-medium text-[#2D6A2D] hover:underline disabled:opacity-50 flex items-center gap-1">
                      {updating === order._id ? <LoadingSpinner size={14} /> : <ChevronDown size={14} />}Mark as {nextStatus}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
