import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Calendar, Clock, DollarSign, TrendingUp, Search, UserPlus, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const MobileDoctorDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* ── DOCTOR GREETING ── */}
            <section className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm overflow-hidden relative">
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em] mb-2">Clinical Session: Active</p>
                    <h1 className="text-3xl font-black text-slate-800 leading-tight">Good morning, <br/>Dr. {user?.name?.split(' ')[0] || 'Doctor'}</h1>
                    
                    <div className="flex items-center gap-6 mt-6">
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-slate-800">12</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patients Today</span>
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-slate-800">04</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Obs</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 h-full w-32 bg-primary-50/50 rounded-l-full -mr-16" />
            </section>

            {/* ── QUICK ACTIONS ── */}
            <div className="grid grid-cols-2 gap-4">
                <Link to="/doctor-dashboard/patients" className="bg-primary-600 rounded-3xl p-5 text-white shadow-lg shadow-primary/20 space-y-3 active:scale-95 transition-transform">
                    <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center">
                        <UserPlus size={20} />
                    </div>
                    <span className="block text-[11px] font-black uppercase tracking-widest">Find Patient</span>
                </Link>
                <Link to="/doctor-dashboard/appointments" className="bg-white border border-slate-100 rounded-3xl p-5 text-slate-800 shadow-sm space-y-3 active:scale-95 transition-transform">
                    <div className="h-10 w-10 bg-slate-50 rounded-2xl flex items-center justify-center text-primary-600">
                        <Calendar size={20} />
                    </div>
                    <span className="block text-[11px] font-black uppercase tracking-widest text-slate-500">My Schedule</span>
                </Link>
            </div>

            {/* ── NEXT PATIENT CARD ── */}
            <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-1">Upcoming Consultation</h3>
                <div className="bg-[#0F172A] rounded-[28px] p-5 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-primary-600 rounded-2xl flex items-center justify-center text-xl font-black">JB</div>
                                <div>
                                    <h4 className="text-lg font-black leading-none">James Burton</h4>
                                    <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mt-1">ID: MS-0921</p>
                                </div>
                            </div>
                            <div className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full border border-primary-500/30 text-[10px] font-black">
                                10:30 AM
                            </div>
                        </div>
                        <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-300">Wait: 5m</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageSquare size={14} className="text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-300">History: Prev. Clear</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-primary-500/10 blur-[50px] rounded-full group-hover:bg-primary-500/20 transition-all" />
                </div>
            </section>

            {/* ── CLINICAL ANALYTICS ── */}
            <section>
                <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Revenue Metrics</h3>
                        <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <div className="flex items-end gap-3 mb-4">
                        <span className="text-3xl font-black text-slate-800">$4,280.00</span>
                        <span className="text-[10px] font-bold text-emerald-500 mb-1">+12.5%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 w-[70%]" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-tighter">70% OF MONTHLY GOAL REACHED</p>
                </div>
            </section>
        </div>
    );
};

export default MobileDoctorDashboard;
