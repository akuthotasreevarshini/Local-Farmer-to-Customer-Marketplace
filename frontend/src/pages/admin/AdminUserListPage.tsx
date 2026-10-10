import { Users } from 'lucide-react'

export default function AdminUserListPage() {
  return (
    <div className="min-h-screen bg-[#FAF3E0] px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users size={28} className="text-[#2D6A2D]" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#2D6A2D]">Users</h1>
        </div>
        <p className="text-gray-500">Paginated user list with role/status filters, suspend/reactivate/delete actions — coming soon.</p>
      </div>
    </div>
  )
}
