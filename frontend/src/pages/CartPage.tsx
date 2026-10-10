import { useEffect, useState, useCallback } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import type { Cart } from '../api/types'
import { useCartStore } from '../stores/useCartStore'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const syncCart = useCartStore((s) => s.syncCart)
  const navigate = useNavigate()

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get<{ success: boolean; data: Cart }>('/api/cart')
      setCart(data.data)
      syncCart(data.data.items.length)
    } catch { setError('Failed to load cart.') }
    finally { setLoading(false) }
  }, [syncCart])

  useEffect(() => { void fetchCart() }, [fetchCart])

  async function updateQty(productId: string, qty: number) {
    setUpdating(productId)
    try {
      const { data } = await axiosInstance.put<{ success: boolean; data: Cart }>(`/api/cart/items/${productId}`, { quantity: qty })
      setCart(data.data); syncCart(data.data.items.length)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert(msg ?? 'Failed to update.')
    } finally { setUpdating(null) }
  }

  async function removeItem(productId: string) {
    setUpdating(productId)
    try {
      const { data } = await axiosInstance.delete<{ success: boolean; data: Cart }>(`/api/cart/items/${productId}`)
      setCart(data.data); syncCart(data.data.items.length)
    } finally { setUpdating(null) }
  }

  const subtotal = cart?.items.reduce((sum, i) => sum + i.priceAtAdd * i.quantity, 0) ?? 0

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart size={28} className="text-[#2D6A2D]" />
          <h1 className="text-2xl font-bold text-[#2D6A2D]">Shopping Cart</h1>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm mb-4">{error}</div>}

        {!cart || cart.items.length === 0 ? (
          <EmptyState title="Your cart is empty" description="Browse products and add items to get started."
            action={<Link to="/products" className="rounded-full bg-[#2D6A2D] text-white px-6 py-2 text-sm font-medium">Shop Now</Link>} />
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              {cart.items.map((item) => {
                const p = item.productId
                const img = p.images?.[0]
                return (
                  <div key={p._id} className="bg-white rounded-2xl shadow p-4 flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-[#FAF3E0] flex items-center justify-center shrink-0 overflow-hidden">
                      {img ? <img src={img} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🛒</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${p._id}`} className="font-semibold text-gray-900 text-sm hover:underline line-clamp-2">{p.name}</Link>
                      <p className="text-sm text-[#2D6A2D] font-medium mt-1">₹{item.priceAtAdd}/{p.unit}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button onClick={() => updateQty(p._id, item.quantity - 1)} disabled={!!updating} className="px-2.5 py-1 hover:bg-gray-50 text-gray-600 disabled:opacity-50"><Minus size={12} /></button>
                          <span className="px-3 text-sm border-x border-gray-200">{updating === p._id ? '…' : item.quantity}</span>
                          <button onClick={() => updateQty(p._id, item.quantity + 1)} disabled={!!updating || item.quantity >= p.availableQuantity} className="px-2.5 py-1 hover:bg-gray-50 text-gray-600 disabled:opacity-50"><Plus size={12} /></button>
                        </div>
                        <button onClick={() => removeItem(p._id)} disabled={!!updating} className="text-gray-400 hover:text-red-500 disabled:opacity-50"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900">₹{(item.priceAtAdd * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow p-5 sticky top-24">
                <h2 className="font-semibold text-gray-800 mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between"><span>Subtotal ({cart.items.length} items)</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Delivery charges</span><span>Calculated at checkout</span></div>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-gray-900 mb-4">
                  <span>Total</span><span>₹{subtotal.toFixed(2)}</span>
                </div>
                <button onClick={() => navigate('/checkout')} className="w-full rounded-full bg-[#2D6A2D] text-white font-semibold py-2.5 hover:bg-[#245424] transition-colors flex items-center justify-center gap-2">
                  Proceed to Checkout <ArrowRight size={16} />
                </button>
                <Link to="/products" className="mt-3 block text-center text-sm text-[#2D6A2D] hover:underline">Continue Shopping</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
