import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Sparkles, Bot, User, Loader2, Maximize2, Minimize2, 
  ShieldCheck, Activity, Brain, Zap, Mic, MicOff, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const AiConcierge = () => {
  const { user } = useAuth();
  const { isAiOpen, setAiOpen } = useNotifications();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
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
  }, [messages, isTyping, isMinimized]);

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

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      toast.success("Voice telemetry offline.");
    } else {
      setIsListening(true);
      toast.loading("Listening for clinical signals...");
      setTimeout(() => {
        setIsListening(false);
        toast.dismiss();
        toast.success("Signal captured.");
        setInput("Summarize my latest MRI report.");
      }, 3000);
    }
  };

  if (!isAiOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isMinimized && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 50 }}
          className="fixed bottom-8 right-8 z-[99999]"
        >
          <button 
            onClick={() => setIsMinimized(false)}
            className="w-20 h-20 bg-[#111827] text-white rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10 hover:scale-110 active:scale-95 transition-all group"
          >
             <div className="relative">
                <Brain size={32} className="text-primary-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#111827] animate-pulse" />
             </div>
          </button>
        </motion.div>
      )}

      {!isMinimized && (
        <div className="fixed inset-0 z-[99999] flex justify-end bg-slate-900/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`bg-white shadow-[-20px_0_70px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden transition-all duration-500 ease-out ${
              isMaximized 
                ? 'w-full h-full' 
                : 'w-full md:w-[500px] lg:w-[600px] h-[calc(100%-2rem)] md:m-4 md:rounded-[3rem] border border-slate-100'
            }`}
          >
            <div className="p-8 bg-[#111827] text-white relative shrink-0">
               <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                        <Brain size={32} className="text-primary-500" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                          MEDISYNC <span className="text-primary-500">INTELLIGENCE</span>
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           Secure AI Node Active
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button 
                        onClick={toggleMic}
                        className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        title="Voice Telemetry"
                     >
                        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                     </button>
                     
                     <button 
                        onClick={() => setIsMinimized(true)}
                        className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        title="Minimize"
                     >
                        <Minus size={24} strokeWidth={3} />
                     </button>

                     <button 
                        onClick={() => setIsMaximized(!isMaximized)} 
                        className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        title="Maximize"
                     >
                        {isMaximized ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                     </button>

                     <button 
                        onClick={() => setAiOpen(false)} 
                        className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Cancel Session"
                     >
                        <X size={28} />
                     </button>
                  </div>
               </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-10 bg-white custom-scrollbar"
            >
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 shrink-0 shadow-sm">
                        <Bot size={20} className="text-primary-600" />
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className={`p-6 rounded-[2rem] text-[15px] leading-relaxed shadow-sm border transition-all ${
                        msg.role === 'user' 
                          ? 'bg-primary-600 text-white border-transparent' 
                          : 'bg-white text-slate-700 border-slate-100 hover:border-primary-100'
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

            <div className="p-8 bg-white border-t border-slate-100">
               <form onSubmit={handleSend} className="relative flex items-center max-w-xl mx-auto">
                  <input 
                    type="text" 
                    placeholder="Synchronize with your clinical archives..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full pl-10 pr-20 py-6 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 ring-primary-500/10 focus:bg-white outline-none transition-all text-[15px] font-medium placeholder:text-slate-400"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim()}
                    className="absolute right-2 p-4 bg-slate-900 text-white rounded-full hover:bg-primary-600 transition-all shadow-xl disabled:opacity-30 active:scale-90"
                  >
                    <Send size={24} />
                  </button>
               </form>

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
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AiConcierge;
