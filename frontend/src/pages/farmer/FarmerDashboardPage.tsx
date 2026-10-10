import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Package, ClipboardList, Plus, Settings, TrendingUp } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { useAuthStore } from '../../stores/useAuthStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function FarmerDashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ products: 0, pendingOrders: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axiosInstance.get<{ success: boolean; data: unknown[] }>('/api/products/farmer/mine'),
      axiosInstance.get<{ success: boolean; data: { orders: Array<{ grandTotal: number; status: string }> } }>('/api/orders/farmer/mine'),
    ]).then(([pr, or]) => {
      const products = Array.isArray(pr.data.data) ? pr.data.data.length : 0
      const orders = or.data.data.orders
      const pendingOrders = orders.filter((o) => o.status === 'placed').length
      const revenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.grandTotal, 0)
      setStats({ products, pendingOrders, revenue })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={28} className="text-[#2D6A2D]" />
            <div>
              <h1 className="text-2xl font-bold text-[#2D6A2D]">Farmer Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
            </div>
          </div>
          <Link to="/farmer/products/new" className="flex items-center gap-2 rounded-full bg-[#2D6A2D] text-white text-sm font-medium px-4 py-2 hover:bg-[#245424]">
            <Plus size={16} />New Product
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Package, label: 'Products', value: stats.products, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: ClipboardList, label: 'Pending Orders', value: stats.pendingOrders, color: 'text-orange-600', bg: 'bg-orange-50' },
            { icon: TrendingUp, label: 'Revenue (Delivered)', value: `₹${stats.revenue.toFixed(0)}`, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl shadow p-4 text-center">
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon size={20} className={color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{String(value)}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { to: '/farmer/products', icon: Package, label: 'Manage Products', desc: 'View, edit, and add your product listings' },
            { to: '/farmer/orders', icon: ClipboardList, label: 'View Orders', desc: 'Track and update your incoming orders' },
            { to: '/farmer/profile', icon: Settings, label: 'Edit Profile', desc: 'Update your farm details and contact info' },
            { to: '/farmer/group-buys', icon: TrendingUp, label: 'Group Buys', desc: 'Create and manage group buy offers' },
          ].map(({ to, icon: Icon, label, desc }) => (
            <Link key={to} to={to} className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FAF3E0] flex items-center justify-center shrink-0">
                <Icon size={20} className="text-[#2D6A2D]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
