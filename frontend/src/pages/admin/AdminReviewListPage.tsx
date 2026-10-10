import { Star } from 'lucide-react'

export default function AdminReviewListPage() {
  return (
    <div className="min-h-screen bg-[#FAF3E0] px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Star size={28} className="text-[#2D6A2D]" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#2D6A2D]">Review Moderation</h1>
        </div>
        <p className="text-gray-500">Pending reviews with approve/reject actions — coming soon.</p>
      </div>
    </div>
  )
}
