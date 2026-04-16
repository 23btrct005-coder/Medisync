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
    <div className="glass-panel p-6 h-full flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Bell size={22} className={notifications.some(n => !n.isRead) ? "animate-bounce" : ""} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Activity Hub</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Live Clinical Feed</p>
          </div>
        </div>
        <div className="relative">
          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-emerald-100">
            Real-time
          </span>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Syncing node data...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100">
              <Clock className="text-slate-200" size={32} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Clear Clinical Context</h4>
            <p className="text-xs text-slate-400 mt-2 font-medium">No new signals detected in your medical workspace.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`group relative pl-10 pb-8 last:pb-0 border-l-2 ${n.isRead ? 'border-slate-50' : 'border-primary/20'} last:border-0 ml-3 transition-all`}
            >
              {/* Activity Dot/Icon */}
              <div className={`absolute -left-[13px] top-0 p-1.5 bg-white border-2 ${n.isRead ? 'border-slate-100 text-slate-400' : 'border-primary text-primary'} rounded-full group-hover:scale-110 transition-all duration-300 shadow-sm z-10`}>
                {getActivityIcon(n.type)}
              </div>

              {/* Activity Content */}
              <div className={`glass-card p-5 hover:shadow-primary/5 transition-all relative overflow-hidden ${n.isRead ? 'opacity-60 bg-slate-50/50' : 'border-primary/10 shadow-lg shadow-primary/5'}`}>
                {/* Visual indicator for unread */}
                {!n.isRead && (
                   <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${n.isRead ? 'text-slate-400' : 'text-primary'}`}>
                    {n.type} • {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button onClick={() => markRead(n.id)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                        <CheckSquare size={14} />
                      </button>
                    )}
                    <button onClick={() => deleteNotification(n.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h4 className={`text-sm font-extrabold mb-1 leading-tight ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                  {n.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                  {n.description}
                </p>
                
                {n.actionLink && (
                  <a 
                    href={n.actionLink}
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                  >
                    {n.actionText || 'Process Signal'}
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer Insight */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <ShieldAlert size={14} className="text-indigo-400" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encrypted Telemetry</span>
          </div>
          <button onClick={fetchNotifications} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
             Resync Nodes
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
