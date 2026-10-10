import { Leaf } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-[#2D6A2D]/20 bg-[#2D6A2D] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-lg font-bold">
              <Leaf size={20} aria-hidden="true" />
              <span>FarmConnect</span>
            </div>
            <p className="text-sm text-white/70">
              Connecting local farmers directly with customers. Fresh produce,
              fair prices.
            </p>
          </div>

          {/* Shop links */}
          <nav aria-label="Shop navigation">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Shop
            </h3>
            <ul className="space-y-2 text-sm text-white/80" role="list">
              <li><a href="/products" className="hover:text-white transition-colors">All Products</a></li>
              <li><a href="/compare" className="hover:text-white transition-colors">Compare Prices</a></li>
              <li><a href="/group-buys" className="hover:text-white transition-colors">Group Buys</a></li>
            </ul>
          </nav>

          {/* Account links */}
          <nav aria-label="Account navigation">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Account
            </h3>
            <ul className="space-y-2 text-sm text-white/80" role="list">
              <li><a href="/login" className="hover:text-white transition-colors">Log In</a></li>
              <li><a href="/register" className="hover:text-white transition-colors">Sign Up</a></li>
              <li><a href="/orders" className="hover:text-white transition-colors">My Orders</a></li>
              <li><a href="/favorites" className="hover:text-white transition-colors">Favorites</a></li>
            </ul>
          </nav>

          {/* Farmers */}
          <nav aria-label="Farmer navigation">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Farmers
            </h3>
            <ul className="space-y-2 text-sm text-white/80" role="list">
              <li><a href="/register" className="hover:text-white transition-colors">Sell on FarmConnect</a></li>
              <li><a href="/farmer/dashboard" className="hover:text-white transition-colors">Farmer Dashboard</a></li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          <p>&copy; {year} FarmConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
