import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Fingerprint, Lock, ShieldCheck, Activity } from 'lucide-react';
import api from '../api/axiosConfig';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/patient/audit-logs');
        setLogs(res.data || []);
      } catch (err) {
        console.error("Failed to fetch security ledger");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionInfo = (action) => {
    switch (action) {
      case 'ACCESS_VIEW': return { label: 'Record View', color: 'bg-indigo-50 text-indigo-600', icon: <Lock size={14} /> };
      case 'RECORD_CREATE': return { label: 'Data Ingestion', color: 'bg-emerald-50 text-emerald-600', icon: <Activity size={14} /> };
      default: return { label: 'Security Event', color: 'bg-slate-50 text-slate-600', icon: <Shield size={14} /> };
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-primary" size={32} /> Security Ledger
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Immutable Interaction Logs</p>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 text-slate-500">
            <Fingerprint size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Clinical Data Access History</h2>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
             <div className="py-20 text-center text-slate-400">
               <Shield className="animate-pulse mx-auto mb-4" size={48} />
               <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Ledger...</p>
             </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-slate-300">
               <ShieldCheck className="mx-auto mb-4 opacity-20" size={64} />
               <p className="text-sm font-bold">No security events indexed</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const info = getActionInfo(log.action);
                return (
                  <div key={log.id} className="p-6 hover:bg-slate-50 rounded-3xl transition-all group border border-transparent hover:border-slate-100">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${info.color}`}>
                        {info.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${info.color}`}>
                            {info.label}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                            <Clock size={10} /> {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-black text-slate-800 mb-1 leading-tight tracking-tight uppercase">
                          {log.performerName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{log.details}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityLogs;
