import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, User, Loader2, Check, CheckCheck } from 'lucide-react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ClinicalChatBox = ({ receiverId, receiverName, onClose }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const stompClient = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchHistory();
        connectWebSocket();

        return () => {
            if (stompClient.current) {
                stompClient.current.disconnect();
            }
        };
    }, [receiverId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/chat/conversation/${receiverId}`);
            setMessages(res.data);
            setLoading(false);
            // Mark as read
            await api.post(`/chat/mark-read/${receiverId}`);
        } catch (err) {
            console.error("Chat history fetch failed", err);
        }
    };

    const connectWebSocket = () => {
        const socket = new SockJS(`${api.defaults.baseURL}/ws`);
        stompClient.current = Stomp.over(socket);
        stompClient.current.debug = null; // Disable debug logs

        const headers = {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        };

        stompClient.current.connect(headers, () => {
            setConnected(true);
            stompClient.current.subscribe(`/user/queue/messages`, (msg) => {
                const newMessage = JSON.parse(msg.body);
                if (newMessage.senderId === receiverId) {
                    setMessages(prev => [...prev, newMessage]);
                    // Mark as read immediately if chat is open
                    api.post(`/chat/mark-read/${receiverId}`);
                }
            });
        }, (err) => {
            console.error("WS Connection Error:", err);
            setTimeout(connectWebSocket, 5000); // Retry
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

    return (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-8 duration-500 text-left">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-white/10">
                        <User size={20} className="text-primary" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-tight leading-none">{receiverName}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                {connected ? 'Live Sync Active' : 'Connecting...'}
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
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
                        const isMe = msg.senderId === user.id;
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                                    isMe 
                                        ? 'bg-primary text-white rounded-tr-none' 
                                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                }`}>
                                    <p className="text-xs font-medium leading-relaxed">{msg.content}</p>
                                    <div className={`flex items-center justify-end gap-1 mt-1 opacity-60`}>
                                        <span className="text-[8px] font-bold uppercase tracking-tighter">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && (
                                            msg.read ? <CheckCheck size={10} /> : <Check size={10} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a clinical message..."
                    className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 ring-primary/50"
                />
                <button 
                    type="submit"
                    disabled={!input.trim()}
                    className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-primary transition-all active:scale-95 disabled:opacity-20"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ClinicalChatBox;
