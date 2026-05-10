import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Bell, Sparkles, ShieldAlert, Calendar, CheckCircle2, Clock, Trash2, CheckSquare } from 'lucide-react';

const ActivityHub = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Poll for new activities every 45 seconds for "Ready Product" feel
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

  return (
    <div className="glass-panel p-8 h-full flex flex-col min-h-[600px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-slate-900/20 group transition-all hover:scale-105 active:scale-95">
            <Bell size={24} className={notifications.some(n => !n.isRead) ? "animate-[bounce_2s_infinite]" : ""} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Activity <span className="not-italic text-slate-400">Hub</span></h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Clinical Telemetry</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nodes Active</span>
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-3 custom-scrollbar relative z-10">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
             <div className="w-12 h-12 border-[3px] border-slate-100 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Clinical Streams...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner group transition-all hover:rotate-12">
              <Clock className="text-slate-300" size={40} />
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Signal Archive Clear</h4>
            <p className="text-[11px] text-slate-400 mt-2 font-semibold uppercase tracking-tighter leading-relaxed max-w-[200px]">No new clinical signals detected in your workspace.</p>
          </div>
        ) : (
          <div className="relative pl-6">
            {/* The Timeline Line - Improved Alignment */}
            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/30 via-slate-100 to-transparent rounded-full" />
            
            <div className="space-y-10">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className="relative group animate-in slide-in-from-left-4 duration-500"
                >
                  {/* Activity Dot/Icon - Precisely Centered on Line */}
                  <div className={`absolute -left-[18px] top-1 h-9 w-9 bg-white border-2 ${n.isRead ? 'border-slate-100 text-slate-300 shadow-none' : 'border-primary text-primary shadow-lg shadow-primary/10'} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 z-20`}>
                    {getActivityIcon(n.type)}
                  </div>

                  {/* Activity Content */}
                  <div className={`ml-8 p-6 rounded-[2rem] border transition-all relative overflow-hidden group-hover:shadow-xl ${
                    n.isRead 
                      ? 'bg-slate-50/30 border-slate-100 opacity-60' 
                      : 'bg-white border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:border-primary/20'
                  }`}>
                    {/* Unread Glow */}
                    {!n.isRead && (
                       <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/10 transition-all" />
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${n.isRead ? 'text-slate-400' : 'text-primary'}`}>
                          {n.type} Node
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                          {new Date(n.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        {!n.isRead && (
                          <button onClick={() => markRead(n.id)} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all active:scale-90" title="Mark Read">
                            <CheckSquare size={16} />
                          </button>
                        )}
                        <button onClick={() => deleteNotification(n.id)} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90" title="Delete Signal">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <h4 className={`text-base font-black mb-2 tracking-tight ${n.isRead ? 'text-slate-600' : 'text-slate-900 uppercase'}`}>
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-5">
                      {n.description}
                    </p>
                    
                    {n.actionLink && (
                      <a 
                        href={n.actionLink}
                        className={`inline-flex items-center gap-2 py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                          n.isRead 
                            ? 'bg-slate-100 text-slate-400' 
                            : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-black hover:translate-x-1'
                        }`}
                      >
                        {n.actionText || 'Process Signal'}
                        <ArrowUpRight size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Status */}
      <div className="mt-10 pt-8 border-t border-slate-100/60 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <ShieldAlert size={16} className="text-indigo-500" />
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Node Isolation <br/><span className="text-emerald-500">Active</span></span>
          </div>
          <button 
            onClick={fetchNotifications} 
            className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95"
          >
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Resync Nodes</span>
             <Clock size={14} className="text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
          </button>
      </div>
    </div>
  );
};

const getActivityIcon = (type) => {
  switch (type?.toUpperCase()) {
    case 'AI_ANALYSIS':
      return <Sparkles size={12} />;
    case 'SECURITY':
    case 'ACCESS':
      return <ShieldAlert size={12} />;
    case 'APPOINTMENT':
      return <Calendar size={12} />;
    case 'UPDATE':
      return <CheckCircle2 size={12} />;
    default:
      return <Bell size={12} />;
  }
};

export default ActivityHub;
