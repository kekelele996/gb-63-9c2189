import { create } from 'zustand'
import { Notification } from '@/types'
import api from '@/utils/api'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get<Notification[]>('/api/notifications')
      const notifications = response.data
      const unreadCount = notifications.filter((n) => !n.is_read).length
      set({
        notifications,
        unreadCount,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  markAsRead: async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`)
      const { notifications } = get()
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      )
      const unreadCount = updated.filter((n) => !n.is_read).length
      set({ notifications: updated, unreadCount })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/api/notifications/read-all')
      const { notifications } = get()
      const updated = notifications.map((n) => ({ ...n, is_read: true }))
      set({ notifications: updated, unreadCount: 0 })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  },
}))
