import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, User, Loader2, Check, CheckCheck } from 'lucide-react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import api, { rawBaseURL } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { useNotifications } from '../context/NotificationContext';

const ClinicalChatBox = ({ receiverId, receiverName, onClose }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [isReceiverOnline, setIsReceiverOnline] = useState(false);
    const [receiverPhoto, setReceiverPhoto] = useState(null);
    const [lastSeen, setLastSeen] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const { lastMessage, markChatAsRead } = useNotifications();

    useEffect(() => {
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 30000); // Force re-render every 30s
        return () => clearInterval(timeInterval);
    }, []);
    const stompClient = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!receiverId || String(receiverId) === 'undefined') return;

        fetchHistory();
        connectWebSocket();
        checkReceiverStatus();

        const statusInterval = setInterval(checkReceiverStatus, 15000); // Check every 15s

        return () => {
            clearInterval(statusInterval);
            if (stompClient.current && stompClient.current.connected) {
                try { stompClient.current.disconnect(); } catch (e) {}
            }
        };
    }, [receiverId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchHistory = async () => {
        if (!receiverId || String(receiverId) === 'undefined') return;
        try {
            const res = await api.get(`/chat/conversation/${receiverId}`);
            setMessages(res.data);
            setLoading(false);
            // Mark as read globally
            markChatAsRead(receiverId);
        } catch (err) {
            console.error("Chat history fetch failed", err);
        }
    };

    const formatLastSeen = (timestamp) => {
        if (!timestamp) return 'Offline';
        const date = new Date(timestamp);
        const diffMs = currentTime - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const checkReceiverStatus = async () => {
        if (!receiverId || String(receiverId) === 'undefined') return;
        try {
            const res = await api.get(`/chat/status/${receiverId}`);
            setIsReceiverOnline(res.data.online);
            setReceiverPhoto(res.data.picture);
            setLastSeen(res.data.lastSeen);
        } catch (err) {
            console.error("Failed to fetch receiver status", err);
        }
    };

    const connectWebSocket = () => {
        if (!receiverId || String(receiverId) === 'undefined') return;
        // Use rawBaseURL to avoid /api/api double prefixing and ensure /ws endpoint
        const socket = new SockJS(`${rawBaseURL}/ws`);
        stompClient.current = Stomp.over(socket);
        stompClient.current.debug = null; 

        const headers = {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        };

        stompClient.current.connect(headers, () => {
            console.log("Chat Socket Connected");
            setConnected(true);
            stompClient.current.subscribe(`/user/queue/messages`, (msg) => {
                const newMessage = JSON.parse(msg.body);
                if (String(newMessage.senderId) === String(receiverId)) {
                    setMessages(prev => [...prev, newMessage]);
                    markChatAsRead(receiverId);
                    setIsReceiverOnline(true);
                }
            });
        }, (err) => {
            setConnected(false);
            console.error("WS Connection Error:", err);
            // Exponential backoff or simple retry
            setTimeout(connectWebSocket, 5000);
        });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const chatMsg = {
            receiverId: receiverId,
            content: input.trim()
        };

        try {
            const res = await api.post('/chat/send', chatMsg);
            setMessages(prev => [...prev, res.data]);
            setInput('');
        } catch (err) {
            toast.error("Message delivery failed");
        }
    };

    return createPortal(
        <div className="fixed inset-0 w-full h-[100dvh] md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[600px] bg-white md:rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.3)] md:border border-slate-200/60 flex flex-col overflow-hidden z-[99999] animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 duration-500 text-left">
            {/* Header - High Fidelity Mobile Style */}
            <div className="pt-[env(safe-area-inset-top,32px)] pb-6 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-2xl relative z-20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden">
                        {receiverPhoto ? (
                            <img src={receiverPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User size={24} className="text-white/60" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.1em] leading-none text-white">{receiverName}</h4>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isReceiverOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {isReceiverOnline ? 'Clinical Node Online' : `Last Seen: ${formatLastSeen(lastSeen)}`}
                            </span>
                        </div>
                    </div>
                </div>
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose} 
                    className="h-10 w-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                    <X size={20} />
                </motion.button>
            </div>

            {/* Messages - Professional Clinical Stage */}
            <div 
                ref={scrollRef} 
                className="flex-1 overflow-y-auto px-5 py-8 space-y-6 relative"
                style={{
                    backgroundColor: '#F1F5F9',
                    backgroundImage: `linear-gradient(rgba(241, 245, 249, 0.96), rgba(241, 245, 249, 0.96)), url("https://www.transparenttextures.com/patterns/cubes.png")`,
                    backgroundRepeat: 'repeat',
                }}
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20">
                        <Loader2 className="animate-spin mb-2" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Decrypting History...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-8">
                        <MessageSquare size={32} className="mb-3 text-slate-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure clinical channel initialized. Start the conversation.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const myUserId = user?.user?.id || user?.id;
                        const isMe = String(msg.senderId) === String(myUserId);
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                                <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-sm relative ${
                                    isMe 
                                        ? 'bg-[#E7FFDB] text-slate-800 rounded-tr-none' 
                                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                }`}>
                                    <p className="text-[13px] font-medium leading-relaxed mb-1">{msg.content}</p>
                                    <div className="flex items-center justify-end gap-1.5 min-w-[60px]">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && (
                                            <div className="flex items-center text-sky-500">
                                                {msg.read ? <CheckCheck size={14} /> : <Check size={14} />}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Bubble Tails */}
                                    <div className={`absolute top-0 w-3 h-3 ${
                                        isMe 
                                            ? '-right-2 bg-[#E7FFDB] [clip-path:polygon(0%_0%,0%_100%,100%_0%)]' 
                                            : '-left-2 bg-white [clip-path:polygon(100%_0%,100%_100%,0%_0%)] border-l border-slate-100'
                                    }`} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area - Native Mobile Style */}
            <div className="pb-[env(safe-area-inset-bottom,32px)] bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                <form onSubmit={handleSend} className="p-4 md:p-6 flex items-center gap-4">
                    <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-[2rem] px-6 py-4 flex items-center shadow-inner focus-within:ring-4 ring-primary/5 focus-within:bg-white transition-all group">
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type an encrypted message..."
                            className="flex-1 bg-transparent border-none outline-none text-[15px] font-semibold placeholder:text-slate-400 text-slate-800"
                        />
                    </div>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        type="submit"
                        disabled={!input.trim()}
                        className={`h-14 w-14 rounded-[1.5rem] flex items-center justify-center transition-all shadow-2xl ${
                            input.trim() 
                                ? 'bg-primary text-white shadow-primary/30 rotate-0' 
                                : 'bg-slate-100 text-slate-400 rotate-12 opacity-50'
                        }`}
                    >
                        <Send size={22} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                    </motion.button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ClinicalChatBox;
