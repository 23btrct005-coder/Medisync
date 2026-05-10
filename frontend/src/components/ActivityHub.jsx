import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Bell, Sparkles, ShieldAlert, Calendar, CheckCircle2, Clock, Trash2, CheckSquare, ArrowUpRight, MessageSquare, HeartPulse, ChevronRight, ChevronLeft } from 'lucide-react';

const ActivityHub = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification");
    }
  };

  const getActivityIcon = (type, isRead) => {
    const iconClass = isRead ? "text-slate-400" : "text-primary-600";
    switch (type?.toUpperCase()) {
      case 'AI_ANALYSIS': return <Sparkles size={16} className={iconClass} />;
      case 'SECURITY':
      case 'ACCESS': return <ShieldAlert size={16} className={iconClass} />;
      case 'APPOINTMENT': return <Calendar size={16} className={iconClass} />;
      case 'UPDATE': return <CheckCircle2 size={16} className={iconClass} />;
      case 'CHAT':
      case 'MESSAGE': return <MessageSquare size={16} className={iconClass} />;
      default: return <Bell size={16} className={iconClass} />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Horizontal Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
            <HeartPulse size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-2">
              Clinical <span className="not-italic text-primary-600">Signals</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Real-time Telemetry Stream</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Live Sync</span>
          </div>
          <button onClick={fetchNotifications} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-900 shadow-sm">
            <Clock size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="relative group">
        <div className="flex overflow-x-auto gap-6 pb-6 pt-2 px-2 custom-scrollbar no-scrollbar scroll-smooth snap-x">
          {loading ? (
            Array.from({length: 4}).map((_, i) => (
              <div key={i} className="min-w-[320px] h-[220px] bg-white border border-slate-100 rounded-[2.5rem] animate-pulse flex flex-col p-8 space-y-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-100 rounded-full" />
                  <div className="h-3 w-5/6 bg-slate-100 rounded-full" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="w-full bg-white border border-dashed border-slate-200 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-200">
                <Bell size={40} />
              </div>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Clinical Stream Clear</h4>
              <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">No active signals detected in your workspace.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`min-w-[320px] md:min-w-[360px] snap-start relative group/card rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
                  n.isRead 
                    ? 'bg-white/40 border-slate-100 opacity-60' 
                    : 'bg-white border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30'
                }`}
              >
                {/* Visual Status Indicator */}
                {!n.isRead && (
                  <div className="absolute top-0 left-0 w-2 h-full bg-primary-600 rounded-r-full" />
                )}

                <div className="p-8 h-full flex flex-col">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover/card:scale-110 group-hover/card:rotate-3 ${
                        n.isRead ? 'bg-slate-50 border-slate-100' : 'bg-primary-50 border-primary-100 shadow-sm'
                      }`}>
                        {getActivityIcon(n.type, n.isRead)}
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${n.isRead ? 'text-slate-400' : 'text-primary-600'}`}>
                          {n.type || 'SIGNAL'}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(n.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!n.isRead && (
                        <button onClick={() => markRead(n.id)} className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Mark Read">
                          <CheckSquare size={16} />
                        </button>
                      )}
                      <button onClick={() => deleteNotification(n.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Signal">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 space-y-3">
                    <h4 className={`text-xl font-black tracking-tight leading-none uppercase ${n.isRead ? 'text-slate-600' : 'text-slate-900 italic'}`}>
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-3">
                      {n.description}
                    </p>
                  </div>

                  {/* Action Link */}
                  {n.actionLink && (
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                      <a 
                        href={n.actionLink}
                        className={`inline-flex items-center gap-2 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                          n.isRead 
                            ? 'bg-slate-100 text-slate-400' 
                            : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-black group/btn'
                        }`}
                      >
                        {n.actionText || 'Process Signal'}
                        <ArrowUpRight size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </a>
                      {!n.isRead && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
                          <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest">Active</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Scroll Hints */}
        {notifications.length > 3 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity">
                <div className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-2xl border border-white/20">
                    <ChevronRight size={24} className="text-primary-600 animate-bounce-x" />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHub;
