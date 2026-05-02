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
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [lastMessage, setLastMessage] = useState(null);
  const [stompClient, setStompClient] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (e) {
      console.error("Failed to fetch notification history");
    }
  }, [user]);

  const fetchUnreadChatCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/chat/unread-counts');
      const total = Object.values(res.data).reduce((acc, count) => acc + count, 0);
      setUnreadChatCount(total);
    } catch (e) {
      console.error("Failed to fetch unread chat counts");
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
    const token = localStorage.getItem('token');
    const wsUrl = rawBaseURL.startsWith('https') 
      ? `${rawBaseURL}/ws` 
      : `${rawBaseURL}/ws`;

    const socket = new SockJS(wsUrl);
    const client = Stomp.over(socket);
    
    client.debug = (msg) => {
      if (process.env.NODE_ENV === 'development') console.log(msg);
    };

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    client.connect(headers, () => {
      setStompClient(client);
      
      // Standard Spring User Destination subscription
      // Spring automatically maps /user/queue/notifications to the authenticated user's private queue
      client.subscribe(`/user/queue/notifications`, (message) => {
        const newNotification = JSON.parse(message.body);
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Instant visual feedback for incoming signals
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white/90 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-primary overflow-hidden`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Incoming Signal</p>
                  <p className="text-sm font-bold text-slate-900">{newNotification.title}</p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{newNotification.description}</p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-slate-100">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                Dismiss
              </button>
            </div>
          </div>
        ), { duration: 6000 });
      });

      // Subscribe to Chat Messages
      client.subscribe(`/user/queue/messages`, (message) => {
          const newMsg = JSON.parse(message.body);
          setUnreadChatCount(prev => prev + 1);
          setLastMessage(newMsg);
      });

    }, (error) => {
      if (user) {
        console.error("CRITICAL: WebSocket connection failed.");
        console.error("Error details:", error);
        if (error && error.type === 'close') {
           console.error("Connection closed by remote peer or network reset.");
        }
        console.log("Retrying WebSocket connection in 5s...");
        setTimeout(connectWebSocket, 5000);
      }
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
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications, unreadChatCount, setUnreadChatCount, fetchUnreadChatCount, lastMessage }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
