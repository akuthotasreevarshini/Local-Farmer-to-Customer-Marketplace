import { create } from 'zustand';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotifState {
  unreadCount: number;
  notifications: Notification[];

  /**
   * Replace the entire notification list and recalculate unreadCount.
   * Call this after fetching from GET /api/notifications.
   */
  setNotifications: (notifications: Notification[]) => void;

  /**
   * Mark a single notification as read by its _id.
   * Decrements unreadCount if the notification was previously unread.
   * Shows "99+" in the UI when unreadCount > 99.
   */
  markRead: (id: string) => void;

  /**
   * Update the unread count badge directly (e.g. from
   * GET /api/notifications/unread-count).
   */
  setUnreadCount: (count: number) => void;
}

export const useNotifStore = create<NotifState>()((set) => ({
  unreadCount: 0,
  notifications: [],

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  markRead: (id) =>
    set((state) => {
      const target = state.notifications.find((n) => n._id === id);
      if (!target || target.isRead) return state; // nothing to do

      const updated = state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n,
      );
      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  setUnreadCount: (count) => set({ unreadCount: count }),
}));
