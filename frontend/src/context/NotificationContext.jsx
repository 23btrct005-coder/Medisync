import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const stompClientRef = useRef(null);

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

  const disconnectWebSocket = useCallback(() => {
    if (stompClientRef.current) {
      try {
        stompClientRef.current.disconnect();
      } catch (e) {}
      stompClientRef.current = null;
      setStompClient(null);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (stompClientRef.current && stompClientRef.current.connected) return;

    const token = localStorage.getItem('token');
    const wsUrl = rawBaseURL + '/ws';

    const socket = new SockJS(wsUrl);
    const client = Stomp.over(socket);
    client.debug = () => {};

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    client.connect(headers, () => {
      stompClientRef.current = client;
      setStompClient(client);
      
      client.subscribe(`/user/queue/notifications`, (message) => {
        const newNotification = JSON.parse(message.body);
        const isEmergency = newNotification.type === 'EMERGENCY';
        
        // Play emergency sound if type is EMERGENCY
        if (isEmergency) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.warn("Audio playback blocked by browser policy"));
        }

        setNotifications(prev => {
          if (prev.some(n => n.id === newNotification.id)) return prev;
          return [newNotification, ...prev];
        });
        setUnreadCount(prev => prev + 1);
        
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full ${isEmergency ? 'bg-red-600' : 'bg-white/90 backdrop-blur-xl'} shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${isEmergency ? 'border-none' : 'border-l-4 border-primary'} overflow-hidden`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isEmergency ? 'text-white/80' : 'text-primary'} mb-1`}>
                    {isEmergency ? '🚨 EMERGENCY SIGNAL' : 'Incoming Signal'}
                  </p>
                  <p className={`text-sm font-bold ${isEmergency ? 'text-white' : 'text-slate-900'}`}>{newNotification.title}</p>
                  <p className={`mt-1 text-xs ${isEmergency ? 'text-white/90' : 'text-slate-500'} line-clamp-2 leading-relaxed`}>{newNotification.description}</p>
                </div>
              </div>
            </div>
            <div className={`flex border-l ${isEmergency ? 'border-white/20' : 'border-slate-100'}`}>
              <button onClick={() => toast.dismiss(t.id)} className={`w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-bold ${isEmergency ? 'text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600'} focus:outline-none`}>Dismiss</button>
            </div>
          </div>
        ), { duration: isEmergency ? 15000 : 6000, id: `notif-${newNotification.id}` });
      });

      client.subscribe(`/user/queue/messages`, (message) => {
          const newMsg = JSON.parse(message.body);
          setUnreadChatCount(prev => prev + 1);
          setLastMessage(newMsg);
      });

    }, (error) => {
      if (user) {
        stompClientRef.current = null;
        setStompClient(null);
        setTimeout(connectWebSocket, 5000);
      }
    });
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadChatCount();
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    return () => disconnectWebSocket();
  }, [user, connectWebSocket, disconnectWebSocket, fetchNotifications, fetchUnreadChatCount]);

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
