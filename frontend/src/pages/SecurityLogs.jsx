import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Fingerprint, Lock, ShieldCheck, Activity } from 'lucide-react';
import api from '../api/axiosConfig';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

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

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.performerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || 
                         (filterType === 'ACCESS' && log.action === 'ACCESS_VIEW') ||
                         (filterType === 'CREATE' && log.action === 'RECORD_CREATE');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-xl mx-auto pt-12 px-6">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-xl shadow-blue-500/10">
                <ShieldCheck className="text-blue-500 w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security Ledger</h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Immutable Clinical Node</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Fingerprint className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input 
                    type="text" 
                    placeholder="Search ledger by actor or event..."
                    className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                {[
                    { id: 'ALL', label: 'All Events' },
                    { id: 'ACCESS', label: 'Access' },
                    { id: 'CREATE', label: 'Creation' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilterType(tab.id)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="p-2">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verifying Node...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-24 text-center px-10">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="text-slate-200 w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No Matches Found</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Adjust your filters or search terms to find specific security events.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredLogs.map((log) => {
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
