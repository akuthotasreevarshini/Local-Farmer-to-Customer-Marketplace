import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import type { Order } from '../../api/types'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700', confirmed: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-yellow-100 text-yellow-700', dispatched: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
}
const NEXT_STATUS: Record<string, string> = { placed: 'confirmed', confirmed: 'packed', packed: 'dispatched', dispatched: 'delivered' }

export default function FarmerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    axiosInstance.get<{ success: boolean; data: Order }>(`/api/orders/${id}`)
      .then((r) => setOrder(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  async function advance() {
    if (!order) return
    const next = NEXT_STATUS[order.status]; if (!next) return
    setUpdating(true)
    try {
      await axiosInstance.put(`/api/orders/${order._id}/status`, { status: next })
      setOrder((o) => o ? { ...o, status: next } : o)
    } catch { alert('Failed.') } finally { setUpdating(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>
  if (!order) return <div className="min-h-screen bg-[#FAF3E0] flex items-center justify-center"><p className="text-gray-500">Order not found.</p></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/farmer/orders" className="flex items-center gap-1 text-sm text-[#2D6A2D] hover:underline mb-6"><ArrowLeft size={14} />All Orders</Link>
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="font-bold text-xl text-gray-900">Order #{order._id.slice(-8).toUpperCase()}</h1>
            <span className={`text-sm font-medium px-3 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
          </div>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.name} ×{item.quantity}</span>
                <span className="font-medium">₹{(item.priceSnapshot * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-bold">
            <span>Total</span><span>₹{order.grandTotal.toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-500">
            <p>Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
            <p>Placed: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
          {NEXT_STATUS[order.status] && (
            <button onClick={advance} disabled={updating} className="flex items-center gap-2 rounded-full bg-[#2D6A2D] text-white px-5 py-2 text-sm font-medium hover:bg-[#245424] disabled:opacity-50">
              {updating ? <LoadingSpinner size={14} /> : <ChevronDown size={14} />}Mark as {NEXT_STATUS[order.status]}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
