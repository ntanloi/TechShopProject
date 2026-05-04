import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import useNotificationStore from '../store/notificationStore';

export default function NotificationBell({ dark = false }) {
    const [showNotifications, setShowNotifications] = useState(false);
    const { user } = useAuth();
    const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
    const nav = useNavigate();

    useEffect(() => {
        if (user) {
            fetchNotifications(user.id);
            // Tự động kiểm tra thông báo mới mỗi 30 giây
            const interval = setInterval(() => fetchNotifications(user.id), 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="relative">
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 transition ${dark ? 'text-white hover:text-orange-300' : 'text-gray-700 hover:text-orange-500'}`}
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {showNotifications && (
                <div className={`absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60]`}>
                    <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                        <span className="font-bold text-sm text-gray-800">Thông báo</span>
                        {unreadCount > 0 && (
                            <button 
                                onClick={() => markAllAsRead(user.id)}
                                className="text-xs text-orange-500 hover:underline"
                            >
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    onClick={() => {
                                        if (!n.isRead) markAsRead(n.id);
                                        setShowNotifications(false);
                                        if (n.message.includes("đơn hàng")) {
                                            nav(user.role === 'ADMIN' ? '/admin/orders' : '/orders');
                                        }
                                    }}
                                    className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition ${!n.isRead ? 'bg-orange-50/50' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold ${!n.isRead ? 'text-orange-600' : 'text-gray-900'}`}>{n.title}</span>
                                        {!n.isRead && <div className="w-2 h-2 bg-orange-500 rounded-full mt-1"></div>}
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                                    <span className="text-[10px] text-gray-400 mt-1 block">
                                        {new Date(n.createdAt).toLocaleString('vi-VN')}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-400">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Chưa có thông báo nào</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
