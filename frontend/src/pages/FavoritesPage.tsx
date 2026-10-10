import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6"><Heart size={28} className="text-[#2D6A2D]" /><h1 className="text-2xl font-bold text-[#2D6A2D]">Favorites</h1></div>
        <EmptyState title="No favorites yet" description="Heart a product or farmer to save them here."
          action={<Link to="/products" className="rounded-full bg-[#2D6A2D] text-white px-6 py-2 text-sm">Browse Products</Link>} />
      </div>
    </div>
  )
}
