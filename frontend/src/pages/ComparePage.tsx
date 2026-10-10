import { useState } from 'react'
import { ArrowLeftRight, Search, Star, MapPin, Truck, Trophy } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import type { CompareProduct } from '../api/types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Link } from 'react-router-dom'

export default function ComparePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CompareProduct[]>([])
  const [lowestPrice, setLowestPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(null); setSearched(true)
    try {
      const { data } = await axiosInstance.get<{ success: boolean; data: { products: CompareProduct[]; lowestPrice: number | null; query: string } }>(`/api/compare?name=${encodeURIComponent(query)}`)
      setResults(data.data.products)
      setLowestPrice(data.data.lowestPrice)
    } catch { setError('Failed to load comparison data.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#FAF3E0]">
      <div className="bg-[#2D6A2D] text-white py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <ArrowLeftRight size={28} aria-hidden="true" />
            <h1 className="text-3xl font-bold">Compare Prices</h1>
          </div>
          <p className="text-white/80 mb-5">Search for a product to compare prices from different farmers</p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. tomato, wheat, onion…"
                className="w-full pl-9 pr-4 py-2.5 rounded-full text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#5DAB24]" />
            </div>
            <button type="submit" className="rounded-full bg-[#5DAB24] px-6 py-2.5 text-sm font-semibold hover:bg-[#4d9420]">Compare</button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading && <div className="flex justify-center py-16"><LoadingSpinner size={48} /></div>}
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">{error}</div>}

        {!loading && searched && results.length === 0 && !error && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🔍</span>
            <p className="text-gray-500">No active listings found for "{query}".</p>
            <p className="text-sm text-gray-400 mt-1">Try a different spelling or browse all products.</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            {lowestPrice !== null && (
              <div className="bg-[#2D6A2D] text-white rounded-2xl p-4 mb-6 flex items-center gap-3">
                <Trophy size={24} className="shrink-0" />
                <div>
                  <p className="font-semibold">Best comparable price: ₹{lowestPrice.toFixed(2)}/kg</p>
                  <p className="text-sm text-white/80">Normalized to per-kilogram for fair comparison</p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-4">{results.length} listing{results.length !== 1 ? 's' : ''} for "{query}"</p>

            <div className="space-y-4">
              {results.map((p, idx) => {
                const isLowest = lowestPrice !== null && p.normalizedPricePerKg === lowestPrice
                const freshDays = p.harvestDate ? Math.floor((Date.now() - new Date(p.harvestDate).getTime()) / 86400000) : null
                return (
                  <div key={p._id} className={`bg-white rounded-2xl shadow p-5 border-2 transition-colors ${isLowest ? 'border-[#5DAB24]' : 'border-transparent'}`}>
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-[#FAF3E0] flex items-center justify-center shrink-0 overflow-hidden">
                        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🛒</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{p.name}</h3>
                          {isLowest && <span className="text-xs bg-[#5DAB24] text-white px-2 py-0.5 rounded-full font-medium">Best Price</span>}
                          {idx === 0 && !isLowest && <span className="text-xs bg-[#FAF3E0] text-[#2D6A2D] px-2 py-0.5 rounded-full font-medium">#{idx + 1} Ranked</span>}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin size={12} /><span>{p.farmer.farmName || p.farmer.name} · {p.farmer.district}, {p.farmer.state}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div>
                            <span className="text-xl font-bold text-[#2D6A2D]">₹{p.pricePerUnit}</span>
                            <span className="text-sm text-gray-500 ml-1">/{p.unit}</span>
                          </div>
                          {p.normalizedPricePerKg !== null && p.unit !== 'kg' && (
                            <span className="text-sm text-gray-400">(≈ ₹{p.normalizedPricePerKg.toFixed(2)}/kg)</span>
                          )}
                          <span className="flex items-center gap-1 text-sm text-gray-500"><Truck size={13} />₹{p.deliveryCharge} delivery</span>
                          {p.averageRating > 0 && <span className="flex items-center gap-1 text-sm text-amber-600"><Star size={13} fill="currentColor" />{p.averageRating.toFixed(1)}</span>}
                          {freshDays !== null && freshDays >= 0 && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Harvested {freshDays === 0 ? 'today' : `${freshDays}d ago`}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{p.availableQuantity} {p.unit} available</p>
                      </div>
                      <Link to={`/products/${p._id}`} className="shrink-0 rounded-full bg-[#2D6A2D] text-white text-sm px-4 py-1.5 hover:bg-[#245424] transition-colors self-start">Buy</Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {results.some((r) => r.normalizedPricePerKg === null) && (
              <p className="mt-4 text-xs text-gray-400">* Listings with units other than kg/g cannot be compared by weight. They are listed separately and sorted by unit price.</p>
            )}
          </>
        )}

        {!searched && (
          <div className="text-center py-16">
            <ArrowLeftRight size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Compare prices across farmers</p>
            <p className="text-sm text-gray-400 mt-1">Enter a product name above to see who offers the best deal</p>
          </div>
        )}
      </div>
    </div>
  )
}
