import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ShoppingBag, Search, SlidersHorizontal, Star, MapPin, X } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import type { Product, ProductsData } from '../api/types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import ProductImage from '../components/common/ProductImage'

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains & Pulses', 'Dairy & Eggs', 'Herbs & Spices', 'Flowers', 'Other']
const CATEGORY_EMOJI: Record<string, string> = {
  Vegetables: '🥦', Fruits: '🍎', 'Grains & Pulses': '🌾', 'Dairy & Eggs': '🥛',
  'Herbs & Spices': '🌿', Flowers: '🌸', Other: '🛒',
}
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' },
]

function ProductCard({ product }: { product: Product }) {
  const farmerName = typeof product.farmerId === 'object' ? product.farmerId.name : 'Local Farmer'
  const location = product.farmerProfile ? `${product.farmerProfile.district}` : ''
  const img = product.images?.[0]
  return (
    <Link to={`/products/${product._id}`} className="bg-white rounded-2xl shadow hover:shadow-md transition-all overflow-hidden group flex flex-col">
      <div className="h-48 bg-[#FAF3E0] flex items-center justify-center overflow-hidden shrink-0">
        <ProductImage src={img} alt={product.name} category={product.category} className="group-hover:scale-105 transition-transform duration-200" />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs bg-[#FAF3E0] text-[#2D6A2D] font-medium px-2 py-0.5 rounded-full self-start mb-2">{product.category}</span>
        <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-tight flex-1">{product.name}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin size={11} /><span>{farmerName}{location ? ` · ${location}` : ''}</span>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-lg font-bold text-[#2D6A2D]">₹{product.pricePerUnit}</span>
            <span className="text-xs text-gray-500 ml-1">/{product.unit}</span>
          </div>
          {product.averageRating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600">
              <Star size={12} fill="currentColor" />{product.averageRating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-400">
          {product.availableQuantity > 0 ? `${product.availableQuantity} ${product.unit} available` : <span className="text-red-500">Out of stock</span>}
        </div>
      </div>
    </Link>
  )
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')

  const category = searchParams.get('category') ?? ''
  const sort = searchParams.get('sort') ?? 'newest'
  const page = Number(searchParams.get('page') ?? '1')

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (searchInput) params.set('search', searchInput)
      if (category) params.set('category', category)
      if (sort) params.set('sort', sort)
      params.set('page', String(page))
      params.set('limit', '12')
      const { data } = await axiosInstance.get<{ success: boolean; data: ProductsData }>(`/api/products?${params}`)
      setProducts(data.data.products)
      setTotal(data.data.total)
      setTotalPages(data.data.totalPages)
    } catch {
      setError('Failed to load products. Is the backend running?')
    } finally { setLoading(false) }
  }, [searchInput, category, sort, page])

  useEffect(() => { void fetchProducts() }, [fetchProducts])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); updateParam('search', searchInput) }

  return (
    <div className="min-h-screen bg-[#FAF3E0]">
      {/* Header */}
      <div className="bg-[#2D6A2D] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag size={28} aria-hidden="true" />
            <h1 className="text-3xl font-bold">Products</h1>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search tomatoes, wheat…"
                className="w-full pl-9 pr-4 py-2 rounded-full text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#5DAB24]" />
            </div>
            <button type="submit" className="rounded-full bg-[#5DAB24] px-5 py-2 text-sm font-medium hover:bg-[#4d9420] transition-colors">Search</button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="bg-white rounded-2xl shadow p-4 sticky top-20">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><SlidersHorizontal size={16} />Filters</h3>
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
              <button onClick={() => updateParam('category', '')}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg mb-1 transition-colors ${!category ? 'bg-[#2D6A2D] text-white' : 'hover:bg-[#FAF3E0] text-gray-700'}`}>
                All Categories
              </button>
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => updateParam('category', c)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg mb-1 transition-colors flex items-center gap-2 ${category === c ? 'bg-[#2D6A2D] text-white' : 'hover:bg-[#FAF3E0] text-gray-700'}`}>
                  <span>{CATEGORY_EMOJI[c]}</span>{c}
                </button>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sort by</p>
              {SORT_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => updateParam('sort', o.value)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg mb-1 transition-colors ${sort === o.value ? 'bg-[#2D6A2D] text-white' : 'hover:bg-[#FAF3E0] text-gray-700'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Mobile chips */}
          <div className="md:hidden flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => updateParam('category', category === c ? '' : c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${category === c ? 'bg-[#2D6A2D] text-white border-[#2D6A2D]' : 'bg-white text-gray-700 border-gray-200'}`}>
                {CATEGORY_EMOJI[c]} {c}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">{loading ? 'Loading…' : `${total} product${total !== 1 ? 's' : ''} found`}</p>
            {(category || searchInput) && (
              <button onClick={() => { setSearchInput(''); setSearchParams(new URLSearchParams()) }}
                className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-500">
                <X size={12} />Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <p className="text-red-600 font-medium mb-2">Could not load products</p>
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={() => void fetchProducts()} className="mt-4 text-sm text-[#2D6A2D] hover:underline">Try again</button>
            </div>
          ) : products.length === 0 ? (
            <EmptyState title="No products found" description="Try a different search or category." action={
              <button onClick={() => { setSearchInput(''); setSearchParams(new URLSearchParams()) }} className="rounded-full bg-[#2D6A2D] px-4 py-2 text-sm text-white">Clear filters</button>
            } />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => updateParam('page', String(p))}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${page === p ? 'bg-[#2D6A2D] text-white' : 'bg-white text-gray-700 hover:bg-[#FAF3E0]'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
