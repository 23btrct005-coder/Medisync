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
      case 'ACCESS_VIEW': return { 
        label: 'Record Accessed', 
        color: 'text-blue-600', 
        bg: 'bg-blue-50',
        icon: <Lock className="w-4 h-4" />,
        desc: 'Security node authorized a data view request.'
      };
      case 'RECORD_CREATE': return { 
        label: 'Record Created', 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50',
        icon: <Activity className="w-4 h-4" />,
        desc: 'New clinical data successfully ingested and signed.'
      };
      default: return { 
        label: 'Security Event', 
        color: 'text-slate-600', 
        bg: 'bg-slate-50',
        icon: <Shield className="w-4 h-4" />,
        desc: 'A clinical protocol event was logged.'
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-xl mx-auto pt-12 px-6">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-xl shadow-blue-500/10 mb-6">
            <ShieldCheck className="text-blue-500 w-8 h-8" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-outfit mb-2">
            Security Ledger
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Immutable tracking of your clinical data interactions
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="text-slate-400 w-5 h-5" />
              <h2 className="text-sm font-semibold text-slate-700">Access History</h2>
            </div>
            {!loading && (
              <span className="px-3 py-1 rounded-full bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {logs.length} EVENTS
              </span>
            )}
          </div>

          <div className="p-2">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verifying Node...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-24 text-center px-10">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="text-slate-200 w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Registry Empty</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  No data interactions have been logged in this clinical node yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {logs.map((log) => {
                  const info = getActionInfo(log.action);
                  return (
                    <div key={log.id} className="p-6 transition-colors hover:bg-slate-50/50 group">
                      <div className="flex items-start gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${info.bg} ${info.color}`}>
                          {info.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${info.color}`}>
                              {info.label}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> 
                              {new Date(log.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <h3 className="text-[15px] font-bold text-slate-800 leading-tight mb-1">
                            {log.performerName}
                          </h3>
                          <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                            {log.details || info.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3" /> End-to-End Encrypted Ledger
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityLogs;
