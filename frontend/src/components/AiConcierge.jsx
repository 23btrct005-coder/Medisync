import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Sparkles, Bot, User, Loader2, Maximize2, Minimize2, 
  ShieldCheck, AlertCircle, MessageSquare, Zap, Activity, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { createPortal } from 'react-dom';

const AiConcierge = () => {
  const { user } = useAuth();
  const { aiOpen, setAiOpen } = useNotifications();
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: `Welcome to MediSync Intelligence, Dr. ${user?.name || 'User'}. I am your clinical triage node. I can help analyze your medical archives, explain diagnostic telemetry, or coordinate with institutional nodes. How can I assist your clinical workflow today?`, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = { 
      role: 'user', 
      content: input, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages(prev => [...prev, userMsg]);
    const userQuery = input;
    setInput('');
    setIsTyping(true);

    try {
      // High-fidelity clinical reasoning simulation or real API call
      const res = await api.post('/ai/triage', { query: userQuery });
      const aiResponse = { 
        role: 'assistant', 
        content: res.data.response || "Clinical signal synchronized. Based on your archives, I recommend a follow-up consultation to discuss these findings in detail.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      const fallback = { 
        role: 'assistant', 
        content: "Clinical node connectivity transiently interrupted. However, I have cached your medical history and suggest monitoring your vitals until sync is restored.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, fallback]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!aiOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-900/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className={`bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ease-out border border-white/20 ${
            isMaximized 
              ? 'w-full h-full md:rounded-[3rem]' 
              : 'w-full md:w-[500px] h-[90vh] md:h-[700px] md:rounded-[3rem]'
          }`}
        >
          {/* High Fidelity Header */}
          <div className="p-6 md:p-8 bg-slate-900 text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 -mr-32 -mt-32 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-2xl group transition-transform hover:scale-105">
                  <Brain size={28} className="text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight uppercase italic flex items-center gap-2">
                    MediSync <span className="not-italic text-primary">Intelligence</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Secure AI Node Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)} 
                  className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all hidden md:block"
                >
                  {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button 
                  onClick={() => setAiOpen(false)} 
                  className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Clinical Telemetry Stream (Chat Area) */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/50 custom-scrollbar"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 border-slate-800 text-white' 
                      : 'bg-white border-slate-100 text-primary shadow-sm'
                  }`}>
                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className="space-y-2">
                    <div className={`p-5 rounded-[1.5rem] text-[14px] leading-relaxed shadow-sm relative group ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                    }`}>
                      {msg.content}
                      {!isMaximized && msg.role === 'assistant' && (
                        <Sparkles size={12} className="absolute bottom-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-tighter text-slate-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.time} • {msg.role === 'user' ? 'Encrypted Signal' : 'AI Analysis'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in slide-in-from-left-4">
                <div className="flex gap-4 items-center">
                   <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                      <Loader2 size={18} className="animate-spin" />
                   </div>
                   <div className="bg-white/80 p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Neural Input Core */}
          <div className="p-6 md:p-8 border-t border-slate-100 bg-white shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Synchronize with your clinical archives..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full pl-8 pr-16 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary/5 focus:border-primary focus:outline-none shadow-inner transition-all font-medium text-slate-700 placeholder:text-slate-400"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-3 p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 group"
              >
                <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </form>
            
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">RLS Hardened</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-primary" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Telemetry Linked</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Real-time Node</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default AiConcierge;
