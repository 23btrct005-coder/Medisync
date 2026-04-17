import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useAuth } from './AuthContext';
import api, { rawBaseURL } from '../api/axiosConfig';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stompClient, setStompClient] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
      setUnreadCount(res.data?.filter(n => !n.read).length || 0);
    } catch (e) {
      console.error("Failed to fetch notification history");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    return () => disconnectWebSocket();
  }, [user]);

  const connectWebSocket = () => {
    const socket = new SockJS(`${rawBaseURL}/ws`);
    const client = Stomp.over(socket);
    
    // Disable logging for cleaner console
    client.debug = () => {};

    client.connect({}, () => {
      setStompClient(client);
      
      // Subscribe to user-specific notification queue
      client.subscribe(`/user/${user.username}/queue/notifications`, (message) => {
        const newNotification = JSON.parse(message.body);
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Push a toast for the new notification
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-primary`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-slate-900">{newNotification.title}</p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{newNotification.description}</p>
                </div>
              </div>
            </div>
          </div>
        ));
      });
    }, (error) => {
      console.error("WebSocket connection failed, retrying in 5s...", error);
      setTimeout(connectWebSocket, 5000);
    });
  };

  const disconnectWebSocket = () => {
    if (stompClient) {
      stompClient.disconnect();
      setStompClient(null);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark notification as read");
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
