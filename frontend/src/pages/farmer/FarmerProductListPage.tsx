import { useEffect, useState, useCallback } from 'react'
import { List, Plus, Edit2, Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'
import type { Product } from '../../api/types'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-600', 'out-of-stock': 'bg-red-100 text-red-700',
}

export default function FarmerProductListPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axiosInstance.get<{ success: boolean; data: Product[] }>('/api/products/farmer/mine')
      setProducts(data.data)
    } catch { setError('Failed to load products.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void fetchProducts() }, [fetchProducts])

  async function toggleStatus(product: Product) {
    setToggling(product._id)
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    try {
      await axiosInstance.put(`/api/products/${product._id}`, { status: newStatus })
      setProducts((prev) => prev.map((p) => p._id === product._id ? { ...p, status: newStatus } : p))
    } catch { alert('Failed to update status.') }
    finally { setToggling(null) }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <List size={28} className="text-[#2D6A2D]" />
            <h1 className="text-2xl font-bold text-[#2D6A2D]">My Products</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/farmer/products/new/easy" className="flex items-center gap-2 rounded-full border border-[#2D6A2D] text-[#2D6A2D] text-sm font-medium px-4 py-2 hover:bg-[#FAF3E0]">
              Easy Mode
            </Link>
            <Link to="/farmer/products/new" className="flex items-center gap-2 rounded-full bg-[#2D6A2D] text-white text-sm font-medium px-4 py-2 hover:bg-[#245424]">
              <Plus size={16} />Add Product
            </Link>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">{error}</div>}

        {products.length === 0 ? (
          <EmptyState title="No products yet" description="Add your first product listing to start selling."
            action={<Link to="/farmer/products/new" className="rounded-full bg-[#2D6A2D] text-white px-6 py-2 text-sm">Add Product</Link>} />
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#FAF3E0] flex items-center justify-center overflow-hidden shrink-0">
                            {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-xl">🛒</span>}
                          </div>
                          <span className="font-medium text-gray-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.category}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{p.pricePerUnit}/{p.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{p.availableQuantity}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? 'bg-gray-100'}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link to={`/farmer/products/${p._id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#2D6A2D]"><Edit2 size={14} /></Link>
                          <button onClick={() => toggleStatus(p)} disabled={toggling === p._id}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#2D6A2D] disabled:opacity-50"
                            title={p.status === 'active' ? 'Deactivate' : 'Activate'}>
                            {p.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

