import { create } from 'zustand';
import type { Notification } from '../types/notification.types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isDropdownOpen: boolean;

  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  appendNotifications: (notifications: Notification[]) => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setDropdownOpen: (open: boolean) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isDropdownOpen: false,

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      ),
      // unreadCount는 서버가 WebSocket으로 정확한 값을 전송하므로 여기서 변경하지 않음
      // (클라이언트에서 직접 감소시키면 WebSocket 이벤트와 중복 적용되는 레이스컨디션 발생)
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  appendNotifications: (notifications) =>
    set((state) => ({
      notifications: [...state.notifications, ...notifications],
    })),

  removeNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setDropdownOpen: (isDropdownOpen) => set({ isDropdownOpen }),

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isDropdownOpen: false,
    }),
}));
