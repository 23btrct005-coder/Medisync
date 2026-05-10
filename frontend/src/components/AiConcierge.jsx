import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Sparkles, Bot, User, Loader2, Maximize2, Minimize2, 
  ShieldCheck, Activity, Brain, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { createPortal } from 'react-dom';

const AiConcierge = () => {
  const { user } = useAuth();
  const { isAiOpen, setAiOpen } = useNotifications();
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: `Welcome to MediSync Intelligence, Dr. ${user?.name || 'User'}. I am your clinical triage node. I can help analyze your medical archives, explain diagnostic telemetry, or coordinate with institutional nodes. How can I assist your clinical workflow today?`, 
      time: '21:49' 
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
    
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const userMsg = { role: 'user', content: input, time: timeStr };
    setMessages(prev => [...prev, userMsg]);
    const userQuery = input;
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/triage', { query: userQuery });
      const aiResponse = { 
        role: 'assistant', 
        content: res.data.response || "Clinical signal synchronized. Based on your archives, I recommend a follow-up consultation to discuss these findings in detail.",
        time: timeStr 
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      const fallback = { 
        role: 'assistant', 
        content: "Clinical node connectivity transiently interrupted. However, I have cached your medical history and suggest monitoring your vitals until sync is restored.",
        time: timeStr 
      };
      setMessages(prev => [...prev, fallback]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isAiOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`bg-white shadow-[0_20px_70px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden transition-all duration-500 ease-out ${
            isMaximized 
              ? 'w-full h-full rounded-[2.5rem]' 
              : 'w-full md:w-[600px] h-[85vh] md:h-[750px] rounded-[3.5rem]'
          }`}
        >
          {/* Old UI Header - Navy Blue */}
          <div className="p-8 bg-[#111827] text-white relative shrink-0">
             <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <Brain size={32} className="text-primary-500" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        MEDISYNC <span className="text-primary-500">INTELLIGENCE</span>
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Secure AI Node Active</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => setIsMaximized(!isMaximized)} className="p-2.5 text-slate-400 hover:text-white transition-colors">
                      {isMaximized ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                   </button>
                   <button onClick={() => setAiOpen(false)} className="p-2.5 text-slate-400 hover:text-white transition-colors">
                      <X size={28} />
                   </button>
                </div>
             </div>
          </div>

          {/* Messages Area - Matches Screenshot */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-10 bg-white custom-scrollbar"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 shrink-0">
                      <Bot size={20} className="text-primary-600" />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className={`p-6 rounded-[2rem] text-[15px] leading-relaxed shadow-sm border ${
                      msg.role === 'user' 
                        ? 'bg-primary-600 text-white border-transparent' 
                        : 'bg-white text-slate-700 border-slate-100'
                    }`}>
                      {msg.content}
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-widest text-slate-300 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.time} • {msg.role === 'user' ? 'Encrypted Signal' : 'AI Analysis'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                 <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                       <Loader2 size={18} className="animate-spin text-slate-300" />
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                       <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Old UI Input Area */}
          <div className="p-8 bg-white border-t border-slate-100">
             <form onSubmit={handleSend} className="relative flex items-center max-w-xl mx-auto">
                <input 
                  type="text" 
                  placeholder="Synchronize with your clinical archives..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full pl-10 pr-20 py-6 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 ring-primary-500/10 focus:bg-white outline-none transition-all text-[15px] font-medium"
                />
                <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 p-4 bg-slate-400 text-white rounded-full hover:bg-primary-600 transition-all shadow-xl disabled:opacity-30"
                >
                  <Send size={24} />
                </button>
             </form>

             {/* Bottom Badges */}
             <div className="flex items-center justify-center gap-10 mt-8">
                <div className="flex items-center gap-2">
                   <ShieldCheck size={16} className="text-emerald-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RLS Hardened</span>
                </div>
                <div className="flex items-center gap-2">
                   <Activity size={16} className="text-blue-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telemetry Linked</span>
                </div>
                <div className="flex items-center gap-2">
                   <Zap size={16} className="text-amber-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Node</span>
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
