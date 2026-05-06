import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, AlertCircle, Settings, Server, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MobileAdminDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* ── SYSTEM STATUS ── */}
            <section className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-2">Global Controller</p>
                    <h1 className="text-3xl font-black mb-6">System <br/>Governance</h1>
                    
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Server size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none">Node Status</p>
                            <p className="text-lg font-black text-white">OPERATIONAL</p>
                        </div>
                    </div>
                </div>
                <Globe className="absolute -bottom-10 -right-10 h-40 w-40 text-white/10" />
            </section>

            {/* ── PENDING APPROVALS ── */}
            <section>
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Identity Verification</h3>
                    <span className="h-5 px-2 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center">8 Pending</span>
                </div>
                
                <div className="space-y-3">
                    {[
                        { name: 'Dr. Robert Chen', type: 'Institution Admin', date: '2h ago' },
                        { name: 'Dr. Elena Rossi', type: 'Professional', date: '5h ago' },
                    ].map((item) => (
                        <div key={item.name} className="bg-white border border-slate-100 p-4 rounded-[24px] flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                    <UserCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-black text-slate-800">{item.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.type}</p>
                                </div>
                            </div>
                            <button className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── SECURITY ALERTS ── */}
            <div className="bg-rose-50 border border-rose-100 rounded-[28px] p-5 flex items-start gap-4">
                <div className="h-10 w-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20">
                    <AlertCircle size={20} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-rose-600">Infrastructure Warning</h4>
                    <p className="text-[11px] font-bold text-rose-800/70 leading-snug">Multiple failed login attempts detected on Institutional Node 04B.</p>
                </div>
            </div>

            {/* ── QUICK CONFIG ── */}
            <div className="grid grid-cols-2 gap-4">
                <Link to="/admin-dashboard/settings" className="bg-white border border-slate-100 rounded-[28px] p-5 flex flex-col gap-3 shadow-sm active:scale-95 transition-transform">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                        <Settings size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Global Config</span>
                </Link>
                <Link to="/admin-dashboard/registry" className="bg-white border border-slate-100 rounded-[28px] p-5 flex flex-col gap-3 shadow-sm active:scale-95 transition-transform">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                        <ShieldCheck size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Registry Audit</span>
                </Link>
            </div>
        </div>
    );
};

export default MobileAdminDashboard;
