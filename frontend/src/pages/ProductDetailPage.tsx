import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Star, ShoppingCart, Package, ArrowLeft, Truck, Calendar } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import type { Product } from '../api/types'
import { useAuthStore } from '../stores/useAuthStore'
import { useCartStore } from '../stores/useCartStore'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const syncCart = useCartStore((s) => s.syncCart)

  const [product, setProduct] = useState<Product & { farmerProfile?: { district: string; state: string; farmName: string; contactPhone?: string } | null }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [addMsg, setAddMsg] = useState<string | null>(null)
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    if (!id) return
    axiosInstance.get<{ success: boolean; data: Product & { farmerProfile?: { district: string; state: string; farmName: string } | null } }>(`/api/products/${id}`)
      .then((r) => setProduct(r.data.data))
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAddToCart() {
    if (!isAuthenticated) { navigate('/login'); return }
    setAdding(true); setAddMsg(null)
    try {
      const { data } = await axiosInstance.post<{ success: boolean; data: { items: unknown[] } }>('/api/cart/items', { productId: id, quantity: qty })
      syncCart(data.data.items.length)
      setAddMsg('Added to cart!')
      setTimeout(() => setAddMsg(null), 2500)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setAddMsg(msg ?? 'Failed to add to cart.')
      setTimeout(() => setAddMsg(null), 3000)
    } finally { setAdding(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>
  if (error || !product) return (
    <div className="min-h-screen bg-[#FAF3E0] flex items-center justify-center">
      <div className="text-center"><Package size={48} className="text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{error}</p><Link to="/products" className="mt-4 inline-block text-[#2D6A2D] hover:underline text-sm">Back to products</Link></div>
    </div>
  )

  const farmerName = typeof product.farmerId === 'object' ? product.farmerId.name : 'Local Farmer'
  const farmerId = typeof product.farmerId === 'object' ? product.farmerId._id : product.farmerId
  const imgs = product.images?.length > 0 ? product.images : []
  const freshDays = product.harvestDate ? Math.floor((Date.now() - new Date(product.harvestDate).getTime()) / 86400000) : null

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-[#2D6A2D] hover:underline mb-6">
          <ArrowLeft size={14} />Back to products
        </Link>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="bg-[#FAF3E0]">
              <div className="h-72 md:h-96 flex items-center justify-center">
                {imgs[imgIdx] ? (
                  <img src={imgs[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-8xl">🛒</span>
                )}
              </div>
              {imgs.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {imgs.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)} className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${imgIdx === i ? 'border-[#2D6A2D]' : 'border-transparent'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-6 flex flex-col">
              <span className="text-xs bg-[#FAF3E0] text-[#2D6A2D] font-medium px-2 py-0.5 rounded-full self-start mb-3">{product.category}</span>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

              <div className="flex items-center gap-2 mb-4">
                <Link to={`/farmers/${farmerId}`} className="text-sm text-[#2D6A2D] hover:underline flex items-center gap-1">
                  <MapPin size={13} />{product.farmerProfile?.farmName || farmerName}
                  {product.farmerProfile?.district && ` · ${product.farmerProfile.district}, ${product.farmerProfile.state}`}
                </Link>
              </div>

              {product.averageRating > 0 && (
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.round(product.averageRating) ? 'text-amber-500 fill-current' : 'text-gray-300'} />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">{product.averageRating.toFixed(1)} ({product.reviewCount} reviews)</span>
                </div>
              )}

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-[#2D6A2D]">₹{product.pricePerUnit}</span>
                <span className="text-gray-500">/{product.unit}</span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-5">
                <div className="flex items-center gap-2"><Truck size={14} className="text-gray-400" />Delivery charge: ₹{product.deliveryCharge}</div>
                {freshDays !== null && freshDays >= 0 && <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400" />Harvested {freshDays === 0 ? 'today' : `${freshDays} day${freshDays !== 1 ? 's' : ''} ago`}</div>}
                <div className="flex items-center gap-2"><Package size={14} className="text-gray-400" />{product.availableQuantity > 0 ? `${product.availableQuantity} ${product.unit} available` : <span className="text-red-500">Out of stock</span>}</div>
              </div>

              {product.status === 'active' && product.availableQuantity > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <label htmlFor="qty" className="text-sm font-medium text-gray-700">Qty:</label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 font-medium">−</button>
                    <span className="px-4 py-1.5 text-sm font-medium border-x border-gray-200">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(product.availableQuantity, q + 1))} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 font-medium">+</button>
                  </div>
                  <span className="text-sm text-gray-500">= ₹{(product.pricePerUnit * qty).toFixed(2)}</span>
                </div>
              )}

              {addMsg && (
                <div className={`mb-3 text-sm px-3 py-2 rounded-lg ${addMsg.includes('Added') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{addMsg}</div>
              )}

              <button onClick={handleAddToCart} disabled={adding || product.status !== 'active' || product.availableQuantity === 0}
                className="flex items-center justify-center gap-2 w-full rounded-full bg-[#2D6A2D] text-white font-semibold py-3 hover:bg-[#245424] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-auto">
                {adding ? <LoadingSpinner size={18} /> : <><ShoppingCart size={18} />Add to Cart</>}
              </button>
            </div>
          </div>

          {product.description && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-4">
              <h2 className="font-semibold text-gray-800 mb-2">About this product</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
