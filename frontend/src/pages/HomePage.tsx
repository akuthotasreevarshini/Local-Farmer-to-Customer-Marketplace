import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, ShoppingBag, Users, TrendingUp, Star, MapPin, ArrowRight, Sprout, Shield, Truck } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import type { Product, ProductsData } from '../api/types'
import ProductImage from '../components/common/ProductImage'

const CATEGORY_ICONS: Record<string, string> = {
  Vegetables: '🥦', Fruits: '🍎', 'Grains & Pulses': '🌾', 'Dairy & Eggs': '🥛',
  'Herbs & Spices': '🌿', Flowers: '🌸', Other: '🛒',
}

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains & Pulses', 'Dairy & Eggs', 'Herbs & Spices']

function ProductCard({ product }: { product: Product }) {
  const farmerName = typeof product.farmerId === 'object' ? product.farmerId.name : 'Local Farmer'
  const location = product.farmerProfile ? `${product.farmerProfile.district}, ${product.farmerProfile.state}` : ''
  const img = product.images?.[0]

  return (
    <Link to={`/products/${product._id}`} className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow overflow-hidden group">
      <div className="h-44 bg-[#FAF3E0] flex items-center justify-center overflow-hidden">
        <ProductImage src={img} alt={product.name} category={product.category} className="group-hover:scale-105 transition-transform duration-200" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
          <span className="shrink-0 text-xs bg-[#FAF3E0] text-[#2D6A2D] font-medium px-2 py-0.5 rounded-full">{product.category}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin size={11} aria-hidden="true" />
          <span>{farmerName}{location ? ` · ${location}` : ''}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-lg font-bold text-[#2D6A2D]">₹{product.pricePerUnit}</span>
            <span className="text-xs text-gray-500 ml-1">/{product.unit}</span>
          </div>
          {product.averageRating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600">
              <Star size={12} fill="currentColor" aria-hidden="true" />
              {product.averageRating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-400">
          {product.availableQuantity > 0 ? `${product.availableQuantity} ${product.unit} left` : <span className="text-red-500">Out of stock</span>}
        </div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosInstance.get<{ success: boolean; data: ProductsData }>('/api/products?limit=6&sort=rating')
      .then((r) => setFeatured(r.data.data.products))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#FAF3E0]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2D6A2D] to-[#1a4a1a] py-20 px-6 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Leaf size={14} aria-hidden="true" />
            <span>Farm fresh, zero middlemen</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Fresh Produce<br />Directly from Farmers
          </h1>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Buy vegetables, fruits, grains, and dairy at fair prices. Connect with local farmers across Andhra Pradesh and Telangana.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-white text-[#2D6A2D] font-semibold px-8 py-3 hover:bg-[#FAF3E0] transition-colors">
              <ShoppingBag size={18} aria-hidden="true" /> Browse Products
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-[#5DAB24] text-white font-semibold px-8 py-3 hover:bg-[#4d9420] transition-colors">
              <Sprout size={18} aria-hidden="true" /> Sell Your Harvest
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-sm mx-auto text-center">
            {[['500+', 'Products'], ['120+', 'Farmers'], ['5000+', 'Customers']].map(([n, l]) => (
              <div key={l}><div className="text-2xl font-bold">{n}</div><div className="text-xs opacity-75">{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-[#2D6A2D] mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`}
              className="flex flex-col items-center gap-2 bg-white rounded-2xl shadow p-5 hover:shadow-md hover:-translate-y-0.5 transition-all text-center">
              <span className="text-4xl">{CATEGORY_ICONS[cat]}</span>
              <span className="text-sm font-medium text-gray-700">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#2D6A2D]">Featured Products</h2>
          <Link to="/products" className="text-sm font-medium text-[#2D6A2D] hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow h-64 animate-pulse" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featured.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow">
            <span className="text-5xl mb-4 block">🌱</span>
            <p className="text-gray-500">Products are being added by farmers. Check back soon!</p>
            <Link to="/register" className="mt-4 inline-block text-sm font-medium text-[#2D6A2D] hover:underline">
              Register as a farmer to list your produce →
            </Link>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-white py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#2D6A2D] text-center mb-10">How FarmConnect Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', icon: ShoppingBag, title: 'Browse & Compare', desc: 'Search products, compare prices from multiple farmers side by side.' },
              { step: '2', icon: Users, title: 'Join Group Buys', desc: 'Team up with others to unlock bulk discounts directly from the farmer.' },
              { step: '3', icon: Truck, title: 'Get it Delivered', desc: 'Fresh produce delivered from the farm to your doorstep.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#FAF3E0] flex items-center justify-center mx-auto mb-4">
                  <Icon size={28} className="text-[#2D6A2D]" aria-hidden="true" />
                </div>
                <div className="text-xs font-bold text-[#5DAB24] uppercase tracking-wider mb-1">Step {step}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { Icon: Shield, title: 'Verified Farmers', desc: 'All farmers are verified before listing products on our marketplace.' },
            { Icon: TrendingUp, title: 'Fair Prices', desc: 'No middlemen. Farmers set their own prices and earn more per harvest.' },
            { Icon: Leaf, title: 'Fresh & Seasonal', desc: 'Produce is listed at harvest time, so you always get the freshest items.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl shadow p-6">
              <Icon size={32} className="text-[#2D6A2D] mb-3" aria-hidden="true" />
              <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Farmer CTA */}
      <section className="bg-[#2D6A2D] py-14 px-6 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Sprout size={40} className="mx-auto mb-4 opacity-90" aria-hidden="true" />
          <h2 className="text-3xl font-bold mb-3">Are You a Farmer?</h2>
          <p className="opacity-90 mb-6">List your produce, set fair prices, and reach thousands of customers directly. No commission, no middlemen.</p>
          <Link to="/register" className="inline-block rounded-full bg-white text-[#2D6A2D] font-semibold px-8 py-3 hover:bg-[#FAF3E0] transition-colors">
            Start Selling Today
          </Link>
        </div>
      </section>
    </div>
  )
}
