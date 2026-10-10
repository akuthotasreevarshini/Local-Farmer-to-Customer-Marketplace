import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { User, MapPin, Phone, Package } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import type { FarmerProfile, Product } from '../api/types'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function FarmerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<FarmerProfile & { recentProducts?: Product[]; productCount?: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosInstance.get<{ success: boolean; data: FarmerProfile & { recentProducts?: Product[] } }>(`/api/farmers/${id}`)
      .then((r) => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>
  if (!data) return <div className="min-h-screen bg-[#FAF3E0] flex items-center justify-center"><p className="text-gray-500">Farmer not found.</p></div>

  const farmerName = typeof data.userId === 'object' ? data.userId.name : 'Farmer'

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-[#2D6A2D] to-[#5DAB24]" />
          <div className="px-6 pb-6">
            <div className="w-20 h-20 rounded-full bg-[#FAF3E0] border-4 border-white -mt-10 flex items-center justify-center overflow-hidden mb-3">
              {data.profilePhotoUrl ? <img src={data.profilePhotoUrl} alt={farmerName} className="w-full h-full object-cover" /> : <User size={36} className="text-[#2D6A2D]" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{data.farmName}</h1>
            <p className="text-sm text-gray-500 mb-3">by {farmerName}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1"><MapPin size={14} />{data.district}, {data.state}</span>
              {data.contactPhone && <span className="flex items-center gap-1"><Phone size={14} />{data.contactPhone}</span>}
              <span className="flex items-center gap-1"><Package size={14} />{data.productCount ?? 0} active products</span>
            </div>
            {data.verificationStatus === 'verified' && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Verified Farmer</span>
            )}
            {data.farmDescription && <p className="mt-4 text-sm text-gray-600">{data.farmDescription}</p>}
          </div>
        </div>

        {data.recentProducts && data.recentProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-[#2D6A2D] mb-4">Products by this farmer</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {data.recentProducts.map((p) => (
                <Link key={p._id} to={`/products/${p._id}`} className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow overflow-hidden">
                  <div className="h-36 bg-[#FAF3E0] flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-5xl">🛒</span>}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <p className="text-sm font-bold text-[#2D6A2D]">₹{p.pricePerUnit}/{p.unit}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

