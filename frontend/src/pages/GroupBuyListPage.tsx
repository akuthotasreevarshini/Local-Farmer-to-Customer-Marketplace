import { useEffect, useState } from 'react'
import { Users, Clock, Trophy, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import type { GroupBuy } from '../api/types'
import { useAuthStore } from '../stores/useAuthStore'
import LoadingSpinner from '../components/common/LoadingSpinner'

function countdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${mins}m left`
  return `${mins}m left`
}

function GroupBuyCard({ gb, onJoin }: { gb: GroupBuy; onJoin: (id: string) => void }) {
  const product = typeof gb.productId === 'object' ? gb.productId : null
  const farmer = typeof gb.farmerId === 'object' ? gb.farmerId : null
  const progress = gb.minimumQuantity > 0 ? Math.min(100, (gb.committedQuantity / gb.minimumQuantity) * 100) : 0
  const remaining = gb.minimumQuantity - gb.committedQuantity
  const img = product?.images?.[0]

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-40 bg-[#FAF3E0] flex items-center justify-center overflow-hidden">
        {img ? <img src={img} alt={String(product?.name)} className="w-full h-full object-cover" /> : <span className="text-6xl">🛒</span>}
      </div>
      <div className="p-5">
        {gb.status === 'confirmed' && (
          <div className="flex items-center gap-1 text-xs text-[#5DAB24] font-semibold mb-2"><Trophy size={12} />Goal Reached!</div>
        )}
        <h3 className="font-semibold text-gray-900 mb-1">{String(product?.name ?? 'Product')}</h3>
        <p className="text-xs text-gray-500 mb-3">by {String(farmer?.name ?? 'Farmer')}</p>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-xl font-bold text-[#2D6A2D]">₹{gb.discountedPricePerUnit}</span>
          <span className="text-xs text-gray-500">/{String(product?.unit ?? 'unit')} (group price)</span>
        </div>

        <div className="mt-3 mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{gb.committedQuantity} / {gb.minimumQuantity} {String(product?.unit ?? 'units')} committed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#5DAB24] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={12} />
            <span>{countdown(gb.expiresAt)}</span>
          </div>
          {gb.status === 'open' && remaining > 0 && (
            <span className="text-xs text-orange-600">{remaining} more needed</span>
          )}
        </div>

        <button onClick={() => onJoin(gb._id)}
          disabled={gb.status !== 'open'}
          className="mt-4 w-full rounded-full bg-[#2D6A2D] text-white text-sm font-semibold py-2 hover:bg-[#245424] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {gb.status === 'confirmed' ? '✓ Goal Met — Join Waitlist' : gb.status === 'open' ? 'Join Group Buy' : 'Expired'}
        </button>
      </div>
    </div>
  )
}

export default function GroupBuyListPage() {
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setJoining] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    axiosInstance.get<{ success: boolean; data: { groupBuys: GroupBuy[] } }>('/api/group-buys')
      .then((r) => setGroupBuys(r.data.data.groupBuys))
      .catch(() => setError('Failed to load group buys.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleJoin(groupBuyId: string) {
    if (!isAuthenticated) { navigate('/login'); return }
    if (user?.role !== 'customer') { setMsg({ type: 'error', text: 'Only customers can join group buys.' }); return }
    setJoining(groupBuyId)
    try {
      await axiosInstance.post(`/api/group-buys/${groupBuyId}/join`, { quantity: 1 })
      setMsg({ type: 'success', text: 'You joined the group buy!' })
      // Refresh
      const { data } = await axiosInstance.get<{ success: boolean; data: { groupBuys: GroupBuy[] } }>('/api/group-buys')
      setGroupBuys(data.data.groupBuys)
    } catch (e: unknown) {
      const errMsg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setMsg({ type: 'error', text: errMsg ?? 'Failed to join.' })
    } finally {
      setJoining(null)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF3E0]">
      <div className="bg-[#2D6A2D] text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Users size={28} aria-hidden="true" />
            <h1 className="text-3xl font-bold">Group Buys</h1>
          </div>
          <p className="text-white/80">Team up with other customers to unlock bulk discounts from farmers</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {msg && (
          <div className={`mb-6 rounded-xl p-4 text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {loading ? <div className="flex justify-center py-16"><LoadingSpinner size={48} /></div>
          : error ? <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">{error}</div>
          : groupBuys.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow">
              <span className="text-5xl block mb-4">🤝</span>
              <p className="text-gray-500 font-medium">No open group buys right now</p>
              <p className="text-sm text-gray-400 mt-1">Farmers will post group buy offers here. Check back soon!</p>
              {user?.role === 'farmer' && (
                <Link to="/farmer/group-buys" className="mt-4 inline-flex items-center gap-1 text-sm text-[#2D6A2D] hover:underline">
                  Create a group buy <ArrowRight size={13} />
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupBuys.map((gb) => (
                <GroupBuyCard key={gb._id} gb={gb} onJoin={handleJoin} />
              ))}
            </div>
          )}

        <div className="mt-12 bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-[#2D6A2D] mb-2">How Group Buying Works</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-600">
            {[
              ['🎯', 'Farmer sets a minimum quantity and discounted price'],
              ['🤝', 'Customers join and commit their quantities'],
              ['✅', "Once the target is hit, everyone gets the discounted price"],
            ].map(([icon, text]) => (
              <div key={String(text)} className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{icon}</span>
                <p>{String(text)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

