import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Users, UserCheck, Wallet, PieChart, ArrowUpRight, Shield, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const MobileHospitalDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* ── INSTITUTIONAL HEADER ── */}
            <section className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl shadow-slate-900/10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Institutional Node</p>
                        <h1 className="text-2xl font-black leading-tight">MediSync <br/>Central Command</h1>
                    </div>
                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Activity size={24} className="text-emerald-400" />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Census</p>
                        <p className="text-xl font-black">1,204</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Staff</p>
                        <p className="text-xl font-black">42 <span className="text-[10px] text-emerald-400">On-Duty</span></p>
                    </div>
                </div>
            </section>

            {/* ── ADMIN ACTIONS ── */}
            <div className="grid grid-cols-3 gap-3 overflow-x-auto no-scrollbar pb-2">
                {[
                    { name: 'Analytics', icon: <PieChart size={20} />, path: '/hospital-dashboard/analytics', color: 'bg-indigo-50 text-indigo-600' },
                    { name: 'Ledger', icon: <Wallet size={20} />, path: '/hospital-dashboard/ledger', color: 'bg-amber-50 text-amber-600' },
                    { name: 'Staff', icon: <UserCheck size={20} />, path: '/hospital-dashboard/staff', color: 'bg-emerald-50 text-emerald-600' },
                ].map((action) => (
                    <Link key={action.name} to={action.path} className="flex-shrink-0 w-full min-w-[100px] aspect-square bg-white border border-slate-100 rounded-[24px] flex flex-col items-center justify-center gap-3 shadow-sm active:scale-95 transition-transform">
                        <div className={`h-12 w-12 ${action.color} rounded-2xl flex items-center justify-center`}>
                            {action.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600">{action.name}</span>
                    </Link>
                ))}
            </div>

            {/* ── CAPACITY MONITOR ── */}
            <section className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Departmental Load</h3>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Optimal</span>
                </div>
                
                <div className="space-y-4">
                    {[
                        { name: 'Emergency', load: 85, color: 'bg-rose-500' },
                        { name: 'ICU', load: 40, color: 'bg-emerald-500' },
                        { name: 'Radiology', load: 60, color: 'bg-amber-500' },
                    ].map((dept) => (
                        <div key={dept.name}>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{dept.name}</span>
                                <span className="text-[11px] font-bold text-slate-400">{dept.load}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div className={`h-full ${dept.color} transition-all duration-1000`} style={{ width: `${dept.load}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── COMPLIANCE & SECURITY ── */}
            <div className="bg-indigo-900 rounded-[28px] p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest">Compliance Node</h4>
                        <p className="text-[10px] font-bold text-indigo-300">All institutional keys synchronized.</p>
                    </div>
                </div>
                <ArrowUpRight size={20} className="text-indigo-400 opacity-40" />
            </div>
        </div>
    );
};

export default MobileHospitalDashboard;
