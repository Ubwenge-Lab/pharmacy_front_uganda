import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function useUnreadNotifications(userType: 'admin' | 'pharmacy' | 'patient' | 'branch') {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get(`/notifications?userType=${userType}`);
        const notifs = res.data.data || res.data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: any) => !n.isRead).length);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifs();
  }, [userType]);

  return { unreadCount, notifications };
}
