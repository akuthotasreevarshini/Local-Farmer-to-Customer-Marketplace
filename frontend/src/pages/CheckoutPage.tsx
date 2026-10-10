import { useState } from 'react'
import { CreditCard, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useCartStore } from '../stores/useCartStore'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function CheckoutPage() {
  const syncCart = useCartStore((s) => s.syncCart)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'gateway'>('cod')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handlePlaceOrder() {
    setLoading(true); setError(null)
    try {
      const { data } = await axiosInstance.post<{ success: boolean; data: { _id: string } }>('/api/orders', { paymentMethod })
      syncCart(0)
      setSuccess(data.data._id)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to place order. Please check your cart.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-[#FAF3E0] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
        <CheckCircle size={56} className="text-[#5DAB24] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#2D6A2D] mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-2">Your order has been confirmed.</p>
        <p className="text-xs text-gray-400 font-mono mb-6">Order #{success.slice(-8).toUpperCase()}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/orders" className="rounded-full bg-[#2D6A2D] text-white px-5 py-2 text-sm font-medium hover:bg-[#245424]">My Orders</Link>
          <Link to="/products" className="rounded-full border border-[#2D6A2D] text-[#2D6A2D] px-5 py-2 text-sm font-medium hover:bg-[#FAF3E0]">Shop More</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard size={28} className="text-[#2D6A2D]" />
          <h1 className="text-2xl font-bold text-[#2D6A2D]">Checkout</h1>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <h2 className="font-semibold text-gray-800 mb-4">Payment Method</h2>
          <div className="space-y-3">
            {([['cod', 'Cash on Delivery', 'Pay when your order arrives'], ['gateway', 'Online Payment', 'Card / UPI / Net Banking (mock)']]) as [string, string, string][]}
            {[['cod', 'Cash on Delivery', 'Pay when your order arrives'], ['gateway', 'Online Payment', 'Card / UPI / Net Banking (mock)']].map(([val, label, desc]) => (
              <label key={val} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === val ? 'border-[#2D6A2D] bg-[#2D6A2D]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="payment" value={val} checked={paymentMethod === val} onChange={() => setPaymentMethod(val as 'cod' | 'gateway')} className="mt-1" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{error}</div>}

        <div className="bg-[#2D6A2D]/5 border border-[#2D6A2D]/20 rounded-xl p-4 text-sm text-gray-600 mb-4">
          <p className="font-medium text-[#2D6A2D] mb-1">Note</p>
          <p>Delivery address management is coming soon. Orders will use a default address for now.</p>
        </div>

        <button onClick={handlePlaceOrder} disabled={loading}
          className="w-full rounded-full bg-[#2D6A2D] text-white font-semibold py-3 hover:bg-[#245424] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {loading ? <LoadingSpinner size={18} /> : 'Place Order'}
        </button>
        <Link to="/cart" className="mt-3 block text-center text-sm text-gray-500 hover:underline">← Back to cart</Link>
      </div>
    </div>
  )
}

