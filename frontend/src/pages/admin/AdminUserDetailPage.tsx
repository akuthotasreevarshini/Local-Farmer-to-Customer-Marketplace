import { useParams } from 'react-router-dom'
import { UserCircle } from 'lucide-react'

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen bg-[#FAF3E0] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <UserCircle size={28} className="text-[#2D6A2D]" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#2D6A2D]">User Detail</h1>
        </div>
        <p className="text-gray-500">User ID: <span className="font-mono">{id}</span></p>
        <p className="text-gray-500 mt-2">User details with suspend/reactivate/delete actions — coming soon.</p>
      </div>
    </div>
  )
}
