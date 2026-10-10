import { useAuthStore } from '../stores/useAuthStore'
import { User, Mail, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CustomerProfilePage() {
  const { user } = useAuthStore()
  if (!user) return null
  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6"><User size={28} className="text-[#2D6A2D]" /><h1 className="text-2xl font-bold text-[#2D6A2D]">My Profile</h1></div>
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF3E0] flex items-center justify-center"><User size={28} className="text-[#2D6A2D]" /></div>
            <div><p className="text-xl font-bold text-gray-900">{user.name}</p><span className="text-xs bg-[#FAF3E0] text-[#2D6A2D] px-2 py-0.5 rounded-full font-medium capitalize">{user.role}</span></div>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" />{user.email}</div>
            <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400" />Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
          </div>
          <Link to="/orders" className="block text-center rounded-full bg-[#2D6A2D] text-white text-sm font-medium py-2.5 hover:bg-[#245424]">View My Orders</Link>
        </div>
      </div>
    </div>
  )
}
