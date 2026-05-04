import React, { useState } from 'react';
import { X, Send, Sparkles, AlertCircle, Bot, User, Loader2, Maximize2, Minimize2 } from 'lucide-react';

const AiChatSidebar = ({ isOpen, onClose, reportData }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello! I've analyzed your ${reportData?.fileName || 'report'}. I can help explain the clinical terms, the AI summary, or the doctor's notes. What would you like to know?`, time: 'Just now' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input, time: 'Just now' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response for "Ready Product" feel
    // In a real implementation, this would call a backend chat endpoint
    setTimeout(() => {
      const aiResponse = { 
        role: 'assistant', 
        content: `Based on your ${reportData?.fileName || 'medical data'}, this appears to be a normal inquiry. I recommend discussing the "Clinical Reasoning" section with Dr. ${reportData?.doctorName || 'your physician'} for a definitive diagnosis.`,
        time: 'Just now' 
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[110] transition-opacity duration-500"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-[120] transform transition-all duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${isMaximized ? 'w-full md:w-[90%] lg:w-[80%]' : 'w-full md:w-[450px]'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Clinical Assistant</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">AI Active • HIPAA Compliant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMaximized(!isMaximized)} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors hidden md:block"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-primary/10 text-primary'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'}`}>
                  {msg.content}
                  <div className={`text-[9px] mt-2 font-bold uppercase tracking-tight opacity-50 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                <Loader2 size={16} className="text-primary animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Ask about terms, summaries, or diagnosis..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full pl-6 pr-14 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none shadow-sm transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-2 p-3 bg-primary text-white rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-[9px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
            AI can make mistakes. Verify with your physician.
          </p>
        </div>
      </div>
    </>
  );
};

export default AiChatSidebar;
