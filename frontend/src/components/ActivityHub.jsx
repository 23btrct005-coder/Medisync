import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { 
  Bell, Sparkles, ShieldAlert, Calendar, CheckCircle2, 
  Clock, Trash2, CheckSquare, ArrowUpRight, Activity,
  MessageSquare, ChevronRight
} from 'lucide-react';

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

  return (
    <div className="glass-panel p-8 h-full flex flex-col min-h-[600px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative">
      {/* Desktop Specific Header Style */}
      <div className="hidden lg:flex items-center justify-between mb-12 relative z-10">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-900/30">
            <Activity size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Clinical <span className="text-primary">Signals</span></h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Real-time Telemetry Stream</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Sync</span>
          </div>
          <button onClick={fetchNotifications} className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
            <Clock size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Original Header (Hidden on Laptop) */}
      <div className="lg:hidden flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-slate-900/20">
            <Bell size={24} className={notifications.some(n => !n.isRead) ? "animate-[bounce_2s_infinite]" : ""} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Activity <span className="not-italic text-slate-400">Hub</span></h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 leading-none">Live Telemetry</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto lg:overflow-x-auto lg:overflow-y-hidden pr-3 lg:pr-0 lg:pb-6 custom-scrollbar relative z-10">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
             <div className="w-12 h-12 border-[3px] border-slate-100 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Clinical Streams...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner group transition-all">
              <Clock className="text-slate-300" size={40} />
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Signal Archive Clear</h4>
          </div>
        ) : (
          <>
            {/* Desktop View: Horizontal Grid Cards */}
            <div className="hidden lg:flex gap-8 h-full items-center px-4">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`flex-shrink-0 w-[420px] h-[340px] bg-white rounded-[3rem] border-l-[12px] shadow-[0_15px_50px_rgba(0,0,0,0.03)] p-10 flex flex-col relative transition-all hover:translate-y-[-8px] hover:shadow-2xl hover:shadow-primary/5 ${n.isRead ? 'border-slate-100 opacity-80' : 'border-primary'}`}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`h-16 w-16 rounded-3xl flex items-center justify-center ${n.isRead ? 'bg-slate-50 text-slate-300' : 'bg-primary/5 text-primary'}`}>
                        {getActivityIcon(n.type, 28)}
                      </div>
                      <div>
                        <h5 className={`text-[12px] font-black uppercase tracking-[0.2em] ${n.isRead ? 'text-slate-300' : 'text-primary'}`}>{n.type}</h5>
                        <p className="text-[11px] font-bold text-slate-400 uppercase mt-1">{new Date(n.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => markRead(n.id)} className="p-2.5 text-slate-200 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><CheckSquare size={20} /></button>
                      <button onClick={() => deleteNotification(n.id)} className="p-2.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                    </div>
                  </div>

                  <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4 leading-tight">
                    {n.title}
                  </h4>
                  <p className="text-[13px] text-slate-500 font-semibold leading-relaxed mb-10 line-clamp-2">
                    {n.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    {n.actionLink ? (
                      <a 
                        href={n.actionLink}
                        className="h-14 px-8 bg-slate-900 text-white rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                      >
                        {n.actionText || 'Open Action'}
                        <ArrowUpRight size={16} strokeWidth={3} />
                      </a>
                    ) : <div />}
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${n.isRead ? 'bg-slate-200' : 'bg-primary animate-pulse'}`} />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Active</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* Optional: Add a "More" arrow at the end */}
              <div className="flex-shrink-0 w-24 h-full flex items-center justify-center">
                 <div className="h-20 w-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-300 hover:text-primary transition-all cursor-pointer">
                    <ChevronRight size={40} />
                 </div>
              </div>
            </div>

            {/* Mobile View: Original Vertical Timeline (Unchanged) */}
            <div className="lg:hidden relative pl-6">
              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/30 via-slate-100 to-transparent rounded-full" />
              <div className="space-y-10">
                {notifications.map((n) => (
                  <div key={n.id} className="relative group">
                    <div className={`absolute -left-[18px] top-1 h-9 w-9 bg-white border-2 ${n.isRead ? 'border-slate-100 text-slate-300 shadow-none' : 'border-primary text-primary shadow-lg shadow-primary/10'} rounded-2xl flex items-center justify-center z-20`}>
                      {getActivityIcon(n.type, 16)}
                    </div>
                    <div className={`ml-8 p-6 rounded-[2rem] border transition-all relative overflow-hidden ${n.isRead ? 'bg-slate-50/30 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)]'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${n.isRead ? 'text-slate-400' : 'text-primary'}`}>{n.type} Node</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button onClick={() => deleteNotification(n.id)} className="h-8 w-8 flex items-center justify-center text-slate-400"><Trash2 size={16} /></button>
                      </div>
                      <h4 className="text-base font-black mb-2 tracking-tight uppercase italic">{n.title}</h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-2">{n.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
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
          <button onClick={fetchNotifications} className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Resync Nodes</span>
             <Clock size={14} className="text-slate-400" />
          </button>
      </div>
    </div>
  );
};

const getActivityIcon = (type, size = 12) => {
  switch (type?.toUpperCase()) {
    case 'AI_ANALYSIS':
      return <Sparkles size={size} />;
    case 'SECURITY':
    case 'ACCESS':
      return <ShieldAlert size={size} />;
    case 'APPOINTMENT':
      return <Calendar size={size} />;
    case 'UPDATE':
      return <CheckCircle2 size={size} />;
    case 'CHAT':
      return <MessageSquare size={size} />;
    default:
      return <Bell size={size} />;
  }
};

export default ActivityHub;
