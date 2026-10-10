import { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import { useNotifStore } from '../stores/useNotifStore'
import type { Notification } from '../stores/useNotifStore'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { markRead, setUnreadCount } = useNotifStore()

  useEffect(() => {
    axiosInstance.get<{ success: boolean; data: { notifications: Notification[] } }>('/api/notifications')
      .then((r) => setNotifications(r.data.data.notifications))
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleMarkAll() {
    await axiosInstance.patch('/api/notifications/read-all').catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  async function handleMarkOne(id: string) {
    await axiosInstance.patch(`/api/notifications/${id}/read`).catch(() => {})
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n))
    markRead(id)
  }

  const unread = notifications.filter((n) => !n.isRead).length

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size={48} /></div>

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell size={28} className="text-[#2D6A2D]" />
            <h1 className="text-2xl font-bold text-[#2D6A2D]">Notifications {unread > 0 && <span className="text-base font-normal text-gray-500">({unread} unread)</span>}</h1>
          </div>
          {unread > 0 && <button onClick={handleMarkAll} className="text-sm text-[#2D6A2D] hover:underline flex items-center gap-1"><Check size={14} />Mark all read</button>}
        </div>
        {notifications.length === 0 ? <EmptyState title="No notifications" description="Order updates and alerts will appear here." /> : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n._id} className={`bg-white rounded-2xl shadow p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'border-l-4 border-[#5DAB24]' : ''}`}
                onClick={() => !n.isRead && handleMarkOne(n._id)}>
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-[#5DAB24]'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
