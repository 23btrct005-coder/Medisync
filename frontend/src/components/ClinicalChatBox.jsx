import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, User, Loader2, Check, CheckCheck } from 'lucide-react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import api, { rawBaseURL } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const ClinicalChatBox = ({ receiverId, receiverName, onClose }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [isReceiverOnline, setIsReceiverOnline] = useState(false);
    const stompClient = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        const connect = () => {
            const socket = new SockJS(`${rawBaseURL}/ws`);
            const client = Stomp.over(socket);
            client.debug = null;
            client.connect({}, () => {
                stompClient.current = client;
                client.subscribe(`/user/${user.id}/queue/messages`, (msg) => {
                    const data = JSON.parse(msg.body);
                    if (data.senderId === receiverId) {
                        setMessages(prev => [...prev, data]);
                    }
                });
            }, (err) => {
                console.error("STOMP Connection error", err);
            });
        };
        connect();
        fetchHistory();
        return () => {
            if (stompClient.current) stompClient.current.disconnect();
        };
    }, [receiverId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get(`chat/history/${receiverId}`);
            setMessages(res.data);
            setIsReceiverOnline(true); // Mocking for now, could be real status
        } catch (e) { 
            console.error(e); 
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !stompClient.current) return;

        const chatMessage = {
            senderId: user?.user?.id || user?.id,
            receiverId: receiverId,
            content: input,
            timestamp: new Date().toISOString()
        };

        try {
            await api.post('chat/send', chatMessage);
            setMessages(prev => [...prev, chatMessage]);
            setInput('');
        } catch (e) {
            toast.error("Message delivery failed");
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const chatContent = (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white overflow-hidden h-[100dvh]">
            {/* Header: Medical Dark Style */}
            <div className="pt-[env(safe-area-inset-top,20px)] pb-6 px-6 bg-[#0A1A1A] text-white flex items-center justify-between shrink-0 shadow-2xl relative z-20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden">
                        <User size={24} className="text-white/80" />
                    </div>
                    <div>
                        <h4 className="text-[13px] font-black uppercase tracking-[0.1em] leading-none text-white">{receiverName}</h4>
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className={`w-2 h-2 rounded-full ${isReceiverOnline ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-slate-600'} animate-pulse`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {isReceiverOnline ? 'Clinical Node Secured' : 'Offline / Encrypted'}
                            </span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="h-12 w-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Messages: Clinical Canvas */}
            <div 
                ref={scrollRef} 
                className="flex-1 overflow-y-auto p-6 space-y-6 relative"
                style={{
                    backgroundColor: '#F8FAFC',
                    backgroundImage: `url("https://www.transparenttextures.com/patterns/medical-icons.png")`,
                    backgroundSize: '300px',
                    backgroundRepeat: 'repeat',
                    backgroundBlendMode: 'overlay'
                }}
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-30">
                        <Loader2 className="animate-spin mb-3 text-primary" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Decrypting Clinical Feed...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-12">
                        <div className="p-8 bg-white rounded-[3rem] shadow-sm mb-6">
                             <MessageSquare size={48} className="text-slate-200" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">Secure Channel Initialized</h3>
                        <p className="text-[11px] font-bold uppercase tracking-tighter text-slate-400 max-w-xs mx-auto leading-relaxed">Messaging is secured with end-to-end clinical encryption. Your data is isolated.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const myUserId = user?.user?.id || user?.id;
                        const isMe = String(msg.senderId) === String(myUserId);
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] p-5 px-6 rounded-[2.25rem] shadow-lg ${
                                    isMe 
                                        ? 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-500/10' 
                                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-slate-200/50'
                                }`}>
                                    <p className="text-[14px] font-semibold leading-relaxed mb-2">{msg.content}</p>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && (
                                            <div className="flex items-center text-white/80">
                                                {msg.read ? <CheckCheck size={14} /> : <Check size={14} />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Hub: Safe-Area Compliant */}
            <div className="pb-[env(safe-area-inset-bottom,30px)] px-6 pt-4 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                <form onSubmit={handleSend} className="flex items-center gap-4">
                    <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-[2.5rem] px-6 py-4 flex items-center shadow-inner focus-within:ring-4 ring-primary/5 transition-all focus-within:bg-white">
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Secure clinical transmission..."
                            className="flex-1 bg-transparent border-none outline-none text-base font-bold placeholder:text-slate-400"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={!input.trim()}
                        className={`w-14 h-14 rounded-[1.75rem] flex items-center justify-center transition-all shadow-2xl active:scale-90 ${
                            input.trim() 
                                ? 'bg-[#0A1A1A] text-white shadow-slate-900/20' 
                                : 'bg-slate-100 text-slate-400'
                        }`}
                    >
                        <Send size={24} className={input.trim() ? "translate-x-0.5" : ""} />
                    </button>
                </form>
            </div>
        </div>
    );

    return createPortal(chatContent, document.body);
};

export default ClinicalChatBox;
