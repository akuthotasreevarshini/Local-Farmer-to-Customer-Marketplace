import { useEffect, useState, type FormEvent } from 'react'
import { TrendingUp, Plus } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import type { GroupBuy, Product } from '../../api/types'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

export default function FarmerGroupBuyPage() {
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ productId: '', discountedPricePerUnit: '', minimumQuantity: '', expiresAt: '' })

  useEffect(() => {
    Promise.all([
      axiosInstance.get<{ success: boolean; data: Product[] }>('/api/products/farmer/mine'),
      axiosInstance.get<{ success: boolean; data: { groupBuys: GroupBuy[] } }>('/api/group-buys'),
    ]).then(([pr, gb]) => {
      setProducts(pr.data.data)
      setGroupBuys(gb.data.data.groupBuys)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      await axiosInstance.post('/api/group-buys', {
        productId: form.productId, discountedPricePerUnit: Number(form.discountedPricePerUnit),
        minimumQuantity: Number(form.minimumQuantity), expiresAt: form.expiresAt,
      })
      const { data } = await axiosInstance.get<{ success: boolean; data: { groupBuys: GroupBuy[] } }>('/api/group-buys')
      setGroupBuys(data.data.groupBuys)
      setShowForm(false)
      setForm({ productId: '', discountedPricePerUnit: '', minimumQuantity: '', expiresAt: '' })
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create.')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3"><TrendingUp size={28} className="text-[#2D6A2D]" /><h1 className="text-2xl font-bold text-[#2D6A2D]">Group Buys</h1></div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-full bg-[#2D6A2D] text-white text-sm font-medium px-4 py-2 hover:bg-[#245424]">
            <Plus size={16} />Create Group Buy
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow p-5 mb-6 space-y-4">
            <h2 className="font-semibold text-gray-800">New Group Buy</h2>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <select value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]">
                <option value="">Select a product</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name} (₹{p.pricePerUnit}/{p.unit})</option>)}
              </select>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Price (₹)</label>
                <input type="number" min="0.01" step="0.01" value={form.discountedPricePerUnit} onChange={(e) => setForm((f) => ({ ...f, discountedPricePerUnit: e.target.value }))} required placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Quantity</label>
                <input type="number" min="1" value={form.minimumQuantity} onChange={(e) => setForm((f) => ({ ...f, minimumQuantity: e.target.value }))} required placeholder="100"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-[#2D6A2D] text-white px-5 py-2 text-sm font-semibold hover:bg-[#245424] disabled:opacity-50">
                {saving ? <LoadingSpinner size={16} /> : null}Create
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        {groupBuys.length === 0 ? <EmptyState title="No group buys yet" description="Create your first group buy to attract bulk orders." /> : (
          <div className="space-y-3">
            {groupBuys.map((gb) => {
              const p = typeof gb.productId === 'object' ? gb.productId : null
              return (
                <div key={gb._id} className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{String(p?.name ?? 'Product')}</p>
                    <p className="text-sm text-gray-500">₹{gb.discountedPricePerUnit} · {gb.committedQuantity}/{gb.minimumQuantity} committed</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${gb.status === 'open' ? 'bg-blue-100 text-blue-700' : gb.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{gb.status}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
