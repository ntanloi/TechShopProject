import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8088/notifications'; // Gateway port

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async (userId) => {
        if (!userId) return;
        set({ loading: true });
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/user/${userId}/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
