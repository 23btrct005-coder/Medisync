import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Bell, Sparkles, ShieldAlert, Calendar, CheckCircle2, Clock, Trash2, CheckSquare, ArrowUpRight, MessageSquare, HeartPulse } from 'lucide-react';

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

  const getStatusColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'AI_ANALYSIS': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'SECURITY': return 'bg-red-100 text-red-700 border-red-200';
      case 'APPOINTMENT': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'UPDATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 shadow-xl rounded-[2.5rem] overflow-hidden relative group/hub">
      {/* Premium Header */}
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/20">
                <HeartPulse size={24} className="animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase italic">
                Clinical <span className="not-italic text-slate-400">Stream</span>
              </h2>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Real-time Telemetry Node</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Live</div>
             <button onClick={fetchNotifications} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-900">
                <Clock size={18} />
             </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Nodes...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-10">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
              <Bell size={40} />
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Stream Isolated</h4>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">No active signals in your current clinical scope.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`relative group rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                  n.isRead 
                    ? 'bg-white/40 border-slate-100 opacity-60 grayscale-[0.5]' 
                    : 'bg-white border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20'
                }`}
              >
                {/* Status Indicator Bar */}
                {!n.isRead && (
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary rounded-r-full" />
                )}

                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110 ${
                        n.isRead ? 'bg-slate-50 border-slate-100' : 'bg-primary-50 border-primary-100 shadow-sm'
                      }`}>
                        {getActivityIcon(n.type, n.isRead)}
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${n.isRead ? 'text-slate-400' : 'text-primary'}`}>
                          {n.type || 'SIGNAL'}
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {!n.isRead && (
                        <button onClick={() => markRead(n.id)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Mark Read">
                          <CheckSquare size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteNotification(n.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete Signal">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-2">
                    <h4 className={`text-sm font-black tracking-tight leading-tight uppercase ${n.isRead ? 'text-slate-600' : 'text-slate-900 italic'}`}>
                      {n.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {n.description}
                    </p>
                  </div>

                  {/* Action Bar */}
                  {n.actionLink && (
                    <div className="mt-5 pt-5 border-t border-slate-50 flex items-center justify-between">
                      <a 
                        href={n.actionLink}
                        className={`flex items-center gap-2 py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 ${
                          n.isRead 
                            ? 'bg-slate-100 text-slate-400' 
                            : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-black group/btn'
                        }`}
                      >
                        {n.actionText || 'Process Signal'}
                        <ArrowUpRight size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </a>
                      {!n.isRead && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest">Priority</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-slate-50/80 border-t border-slate-100">
         <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                  <ShieldAlert size={16} />
               </div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                  Node Integrity <br/><span className="text-primary">Secured via RLS</span>
               </p>
            </div>
            <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
                  </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default ActivityHub;
