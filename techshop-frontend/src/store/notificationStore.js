import { create } from 'zustand';
import axiosClient from '../api/axios';
import { API_ROUTES } from '../api/routes';

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async (userId) => {
        if (!userId) return;
        set({ loading: true });
        try {
            const res = await axiosClient.get(API_ROUTES.notifications.byUser(userId));
            set({ notifications: res.data, loading: false });
            get().updateUnreadCount(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set({ loading: false });
        }
    },

    updateUnreadCount: (notifs) => {
        const count = notifs.filter(n => !n.isRead).length;
        set({ unreadCount: count });
    },

    markAsRead: async (notificationId) => {
        try {
            await axiosClient.put(API_ROUTES.notifications.markRead(notificationId));
            set(state => ({
                notifications: state.notifications.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            }));
            get().updateUnreadCount(get().notifications);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    },

    markAllAsRead: async (userId) => {
        try {
            await axiosClient.put(API_ROUTES.notifications.markAllRead(userId));
            set(state => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }
}));

export default useNotificationStore;
