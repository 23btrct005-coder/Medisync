import React, { useState } from 'react';
import { Bell, X, Check, ExternalLink, Calendar, FileText, Shield, Info } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT': return <Calendar className="text-primary" size={16} />;
      case 'AI_ANALYSIS': return <FileText className="text-indigo-500" size={16} />;
      case 'SECURITY': return <Shield className="text-rose-500" size={16} />;
      default: return <Info className="text-slate-400" size={16} />;
    }
  };

  const handleAction = (n) => {
    if (n.actionLink) {
      if (window.location.pathname === n.actionLink) {
        // Force refresh or just close menu if already there
        setIsOpen(false);
      } else {
        navigate(n.actionLink);
        setIsOpen(false);
      }
    }
    if (!n.read) {
      markAsRead(n.id);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all ${
          isOpen ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-4 w-80 sm:w-96 bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-[2rem] z-[400] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Notifications</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Alerts</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[28rem] overflow-y-auto scrollbar-hide py-2">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell size={32} className="text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">All clear!</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">No new alerts found</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      className={`px-6 py-4 flex gap-4 hover:bg-slate-50/80 transition-all cursor-pointer relative group ${!n.read ? 'bg-primary/5' : ''}`}
                      onClick={() => handleAction(n)}
                    >
                      {!n.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />}
                      
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        !n.read ? 'bg-white' : 'bg-slate-50'
                      }`}>
                        {getIcon(n.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={`text-xs font-black truncate ${!n.read ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</p>
                          <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-2">{n.description}</p>
                        
                        {(n.actionText || !n.read) && (
                          <div className="flex items-center gap-3">
                            {n.actionText && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1 group-hover:underline">
                                {n.actionText} <ExternalLink size={10} />
                              </span>
                            )}
                            {!n.read && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 hover:underline"
                              >
                                Mark Read <Check size={10} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                   <button 
                    onClick={() => { /* Navigate to full notifications page if needed */ }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors"
                   >
                     View Complete History
                   </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
