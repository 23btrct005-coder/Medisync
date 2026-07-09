import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { motion } from 'framer-motion';
import { 
    Heart, Activity, Zap, TrendingUp, Calendar, 
    MessageSquare, AlertCircle, Plus, ChevronRight, 
    Stethoscope, FileText, Pill, ShieldCheck, Wallet,
    Clock, MapPin, Zap as Flash, Bell, ClipboardList, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ActivityHub from '../../components/ActivityHub';

const MobileDashboard = () => {
    const { user } = useAuth();
    const [vitals, setVitals] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMobileData = async () => {
            try {
                const [vitalsRes, apptsRes, chatRes, reqsRes] = await Promise.all([
                    api.get('/patient/vitals'),
                    api.get('/appointments/my-appointments'),
                    api.get('/chat/unread-count'),
                    api.get('patient/requests')
                ]);
                if (vitalsRes.data && vitalsRes.data.length > 0) {
                    setVitals(vitalsRes.data[vitalsRes.data.length - 1]);
                }
                setAppointments(apptsRes.data || []);
                setUnreadChatCount(chatRes.data || 0);
                setRequests(reqsRes.data || []);
            } catch (e) {
                console.error("Clinical sync failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMobileData();
    }, []);

    const upcoming = appointments && Array.isArray(appointments)
        ? appointments
            .filter(a => {
                if (!a || !a.status || !a.appointmentDate) return false;
                const d = new Date(a.appointmentDate);
                return a.status === 'BOOKED' && !isNaN(d.getTime()) && d >= new Date().setHours(0,0,0,0);
            })
            .sort((a,b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())[0]
        : null;

    const handleApproveRequest = async (id) => {
        try {
            await api.post(`patient/requests/${id}/accept`);
            toast.success("Clinical access granted");
            setRequests(requests.filter(r => r.id !== id));
        } catch (err) {
            toast.error("Failed to approve request");
        }
    };

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
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hello, {(user?.name || 'User').split(' ')[0]}</h2>
                </div>
            </motion.div>

            {/* ── ACCESS REQUESTS ── */}
            {requests.length > 0 && (
                <motion.div variants={item} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Bell size={18} /></div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Access Requests</h2>
                        </div>
                        <span className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-full animate-pulse uppercase tracking-widest">{requests.length} Pending</span>
                    </div>
                    
                    <div className="space-y-3">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-black text-emerald-500 overflow-hidden shrink-0">
                                        {req.doctor?.profilePictureUrl ? (
                                            <img src={req.doctor.profilePictureUrl} className="w-full h-full object-cover" alt="Dr." />
                                        ) : "Dr"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-slate-800 text-xs truncate">Dr. {req.doctor?.name || 'Physician'}</p>
                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest truncate">License Verified</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleApproveRequest(req.id)}
                                    className="px-4 py-2 bg-[#0A1A1A] text-white text-[9px] font-black rounded-xl hover:bg-emerald-500 transition-all uppercase tracking-widest shrink-0 active:scale-95"
                                >
                                    Authorize
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

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
                                {upcoming.serviceName || `Dr. ${(upcoming.doctor?.name || 'Staff').split(' ')[0]}`}
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

            <motion.div variants={item} className="grid grid-cols-2 gap-4">
                {[
                    { name: 'Reports', path: '/dashboard/reports', icon: <FileText size={28} />, color: 'bg-violet-100 text-violet-600' },
                    { name: 'Schedule', path: '/dashboard/sessions', icon: <Calendar size={28} />, color: 'bg-indigo-100 text-indigo-600' },
                    { name: 'Records', path: '/dashboard/records', icon: <ClipboardList size={28} />, color: 'bg-blue-100 text-blue-600' },
                    { name: 'My Doctors', path: '/dashboard/doctors', icon: <Users size={28} />, color: 'bg-emerald-100 text-emerald-600' },
                ].map((s) => s && (
                    <button 
                        key={s.name}
                        onClick={() => navigate(s.path)}
                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex flex-col items-center gap-4 active:scale-95 transition-all hover:border-primary-100 shadow-sm"
                    >
                        <div className={`h-16 w-16 ${s.color} rounded-[1.5rem] flex items-center justify-center shadow-sm`}>
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

            {/* ── ACTIVITY HUB (NOTIFICATIONS) ── */}
            <motion.div variants={item}>
                <ActivityHub />
            </motion.div>
        </motion.div>
    );
};

export default MobileDashboard;
