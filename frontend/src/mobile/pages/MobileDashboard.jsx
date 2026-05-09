import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { motion } from 'framer-motion';
import { 
    Heart, Activity, Zap, TrendingUp, Calendar, 
    MessageSquare, AlertCircle, Plus, ChevronRight, 
    Stethoscope, FileText, Pill, ShieldCheck, Wallet,
    Clock, MapPin, Zap as Flash, Bell, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MobileDashboard = () => {
    const { user } = useAuth();
    const [vitals, setVitals] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMobileData = async () => {
            try {
                const [vitalsRes, apptsRes, chatRes] = await Promise.all([
                    api.get('/patient/vitals'),
                    api.get('/appointments/my-appointments'),
                    api.get('/chat/unread-count')
                ]);
                if (vitalsRes.data && vitalsRes.data.length > 0) {
                    setVitals(vitalsRes.data[vitalsRes.data.length - 1]);
                }
                setAppointments(apptsRes.data || []);
                setUnreadChatCount(chatRes.data || 0);
            } catch (e) {
                console.error("Clinical sync failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMobileData();
    }, []);

    const upcoming = appointments
        .filter(a => a.status === 'BOOKED' && new Date(a.appointmentDate) >= new Date().setHours(0,0,0,0))
        .sort((a,b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[70vh]">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-primary-600"
            >
                <Activity size={40} />
            </motion.div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Clinical Node...</p>
        </div>
    );

    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* ── GREETING ── */}
            <motion.div variants={item} className="flex items-center justify-between pb-2">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Clinical Terminal</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hello, {user?.name?.split(' ')[0]}</h2>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                    <Bell size={20} className="text-slate-400" />
                </div>
            </motion.div>

            {/* ── PRIORITY 1: EMERGENCY & URGENT ── */}
            <motion.div variants={item} className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => navigate('/dashboard/booking?mode=service')}
                    className="relative group h-40 rounded-[2.5rem] overflow-hidden active:scale-95 transition-transform"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-600 to-rose-700" />
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Activity size={60} /></div>
                    <div className="relative h-full p-6 flex flex-col justify-between text-white">
                        <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <AlertCircle size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Priority Lane</p>
                            <p className="text-lg font-black uppercase leading-tight">Emergency</p>
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => navigate('/dashboard/booking')}
                    className="relative group h-40 rounded-[2.5rem] overflow-hidden active:scale-95 transition-transform"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Stethoscope size={60} /></div>
                    <div className="relative h-full p-6 flex flex-col justify-between text-white">
                        <div className="h-10 w-10 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <ClipboardList size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Clinical Hub</p>
                            <p className="text-lg font-black uppercase leading-tight">Diagnostic</p>
                        </div>
                    </div>
                </button>
            </motion.div>


            {/* ── UPCOMING PROTOCOL ── */}
            {upcoming && (
                <motion.div 
                    variants={item}
                    onClick={() => navigate('/dashboard/sessions')}
                    className="relative overflow-hidden bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all group hover:border-primary-200"
                >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-primary-50/30 rounded-full -translate-y-12 translate-x-12" />
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="h-16 w-16 bg-primary-50 text-primary-600 rounded-[1.5rem] flex flex-col items-center justify-center border border-primary-100 shadow-inner">
                            <span className="text-[8px] font-black uppercase leading-none mb-1 opacity-60">
                                {new Date(upcoming.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-xl font-black leading-none">
                                {new Date(upcoming.appointmentDate).getDate()}
                            </span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">Next Protocol</p>
                            <h4 className="text-lg font-black text-slate-900 leading-none">
                                {upcoming.serviceName || `Dr. ${upcoming.doctor?.name?.split(' ')[0]}`}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                                    <Clock size={10} /> {upcoming.timeSlot}
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <Zap size={10} /> Confirmed
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <ChevronRight size={20} />
                    </div>
                </motion.div>
            )}

            {/* ── CORE SERVICE GRID ── */}
            <motion.div variants={item} className="grid grid-cols-4 gap-3">
                {[
                    { name: 'Reports', path: '/dashboard/reports', icon: <FileText size={20} />, color: 'bg-violet-100 text-violet-600' },
                    { name: 'Rx', path: '/dashboard/medications', icon: <Pill size={20} />, color: 'bg-rose-100 text-rose-600' },
                    { name: 'Records', path: '/dashboard/records', icon: <ClipboardList size={20} />, color: 'bg-blue-100 text-blue-600' },
                    { name: 'Security', path: '/dashboard/security', icon: <ShieldCheck size={20} />, color: 'bg-cyan-100 text-cyan-600' },
                ].map((s) => (
                    <button 
                        key={s.name}
                        onClick={() => navigate(s.path)}
                        className="bg-white p-4 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-3 active:scale-90 transition-all hover:border-primary-100 shadow-sm"
                    >
                        <div className={`h-12 w-12 ${s.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                            {s.icon}
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{s.name}</span>
                    </button>
                ))}
            </motion.div>

            {/* ── QUICK MESSAGE ── */}
            <motion.button 
                variants={item}
                onClick={() => navigate('/dashboard/messages')}
                className="relative overflow-hidden w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-2xl shadow-primary-600/30 active:scale-95 transition-all"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500" />
                <MessageSquare size={16} className="relative z-10" />
                <span className="relative z-10">Secure Chat Terminal</span>
                {unreadChatCount > 0 && (
                    <div className="relative z-10 h-5 w-5 bg-white text-primary-600 rounded-full flex items-center justify-center text-[10px] font-black">
                        {unreadChatCount}
                    </div>
                )}
            </motion.button>
        </motion.div>
    );
};

export default MobileDashboard;
