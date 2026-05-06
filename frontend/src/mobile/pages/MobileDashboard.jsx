import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Calendar, ShieldCheck, ArrowRight, Heart, Pill, Wallet, Stethoscope, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const MobileDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* ── GREETING & SCORE ── */}
            <section className="relative overflow-hidden bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl shadow-slate-900/20">
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400 mb-2">Biometric Status: Active</p>
                    <h1 className="text-3xl font-black mb-6 leading-tight">Welcome back, <br/>{user?.name?.split(' ')[0] || 'User'}</h1>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20 flex items-center justify-center">
                            <svg className="absolute inset-0 h-full w-full -rotate-90">
                                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="226" strokeDashoffset="45" className="text-primary-500" />
                            </svg>
                            <span className="text-xl font-black">82</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Health Sync Score</p>
                            <p className="text-[10px] text-emerald-400 font-bold">+4% from last week</p>
                        </div>
                    </div>
                </div>
                {/* Decorative element */}
                <div className="absolute -top-10 -right-10 h-40 w-40 bg-primary-600/20 blur-[80px] rounded-full" />
            </section>

            {/* ── QUICK ACTIONS SCROLLER ── */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                {[
                    { name: 'Wallet', icon: <Wallet className="text-amber-500" />, path: '/dashboard/wallet' },
                    { name: 'Consult', icon: <Stethoscope className="text-primary-500" />, path: '/dashboard/booking' },
                    { name: 'Meds', icon: <Pill className="text-rose-500" />, path: '/dashboard/medications' },
                    { name: 'Files', icon: <FileText className="text-indigo-500" />, path: '/dashboard/records' },
                ].map((action) => (
                    <Link key={action.name} to={action.path} className="flex-shrink-0 w-24 h-24 bg-white border border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
                        <div className="h-10 w-10 bg-slate-50 rounded-2xl flex items-center justify-center">
                            {action.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600">{action.name}</span>
                    </Link>
                ))}
            </div>

            {/* ── UPCOMING APPOINTMENT ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Next Appointment</h3>
                    <Link to="/dashboard/sessions" className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1">
                        View All <ArrowRight size={12} />
                    </Link>
                </div>
                <div className="bg-white border border-slate-100 rounded-[24px] p-5 flex items-center gap-4 shadow-sm">
                    <div className="h-14 w-14 bg-primary-50 rounded-2xl flex flex-col items-center justify-center text-primary-600 shrink-0">
                        <span className="text-xs font-black uppercase tracking-tighter">May</span>
                        <span className="text-xl font-black">12</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-0.5">Cardiology Consultation</p>
                        <h4 className="text-base font-extrabold text-slate-800 truncate">Dr. Sarah Jenkins</h4>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <Calendar size={10} /> 10:30 AM
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                Confirmed
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HEALTH VITALS GRID ── */}
            <section className="grid grid-cols-2 gap-4">
                <div className="bg-rose-50 border border-rose-100 p-5 rounded-[24px] space-y-3">
                    <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                        <Heart size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-rose-600/60 uppercase tracking-widest">Heart Rate</p>
                        <p className="text-2xl font-black text-slate-800">72 <span className="text-xs font-bold text-slate-400">bpm</span></p>
                    </div>
                </div>
                <div className="bg-primary-50 border border-primary-100 p-5 rounded-[24px] space-y-3">
                    <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-primary-500 shadow-sm">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-primary-600/60 uppercase tracking-widest">BP</p>
                        <p className="text-2xl font-black text-slate-800">120/80 <span className="text-xs font-bold text-slate-400">mmHg</span></p>
                    </div>
                </div>
            </section>

            {/* ── SECURE ACCESS BANNER ── */}
            <div className="bg-emerald-900 rounded-[24px] p-4 flex items-center gap-4 text-white overflow-hidden relative">
                <div className="h-10 w-10 bg-emerald-800 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="text-emerald-400" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Data Sovereignty</p>
                    <p className="text-[11px] font-bold opacity-80 leading-snug">All medical records are encrypted and stored in your sovereign node.</p>
                </div>
                <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-emerald-800/40 to-transparent" />
            </div>
        </div>
    );
};

export default MobileDashboard;
