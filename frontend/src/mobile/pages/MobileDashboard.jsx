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
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMobileData = async () => {
            try {
                const [vitalsRes, apptsRes] = await Promise.all([
                    api.get('/patient/vitals'),
                    api.get('/appointments/my-appointments')
                ]);
                if (vitalsRes.data && vitalsRes.data.length > 0) {
                    setVitals(vitalsRes.data[vitalsRes.data.length - 1]);
                }
                setAppointments(apptsRes.data || []);
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
            {/* ── PRIORITY 1: EMERGENCY & URGENT ── */}
            <motion.div variants={item} className="flex gap-3">
                <button 
                    onClick={() => navigate('/dashboard/booking')}
                    className="flex-1 bg-rose-600 p-4 rounded-[2rem] text-white flex flex-col justify-between h-32 shadow-xl shadow-rose-600/20 active:scale-95 transition-transform"
                >
                    <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Urgent</p>
                        <p className="text-sm font-black uppercase leading-none">Emergency</p>
                    </div>
                </button>
                <button 
                    onClick={() => navigate('/dashboard/booking')}
                    className="flex-1 bg-slate-900 p-4 rounded-[2rem] text-white flex flex-col justify-between h-32 shadow-xl shadow-slate-900/20 active:scale-95 transition-transform"
                >
                    <div className="h-10 w-10 bg-primary-600 rounded-2xl flex items-center justify-center">
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Institutional</p>
                        <p className="text-sm font-black uppercase leading-none">Diagnostic</p>
                    </div>
                </button>
            </motion.div>


            {/* ── UPCOMING PROTOCOL ── */}
            {upcoming && (
                <motion.div 
                    variants={item}
                    onClick={() => navigate('/dashboard/sessions')}
                    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest mb-0.5">Next Session</p>
                            <h4 className="text-base font-black text-slate-800 leading-tight">
                                {upcoming.serviceName || `Dr. ${upcoming.doctor?.name}`}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock size={10} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500">{upcoming.timeSlot}</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                        <ChevronRight size={20} />
                    </div>
                </motion.div>
            )}

            {/* ── CORE SERVICE GRID ── */}
            <motion.div variants={item} className="grid grid-cols-2 gap-3">
                {[
                    { name: 'AI Reports', path: '/dashboard/reports', icon: <FileText size={20} />, color: 'bg-violet-50 text-violet-600' },
                    { name: 'Rx Vault', path: '/dashboard/medications', icon: <Pill size={20} />, color: 'bg-rose-50 text-rose-600' },
                    { name: 'Clinical Info', path: '/dashboard/records', icon: <ClipboardList size={20} />, color: 'bg-blue-50 text-blue-600' },
                    { name: 'Security', path: '/dashboard/security', icon: <ShieldCheck size={20} />, color: 'bg-cyan-50 text-cyan-600' },
                ].map((s) => (
                    <button 
                        key={s.name}
                        onClick={() => navigate(s.path)}
                        className="bg-white p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 active:bg-slate-50 transition-colors"
                    >
                        <div className={`h-12 w-12 ${s.color} rounded-2xl flex items-center justify-center`}>
                            {s.icon}
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter leading-none">{s.name}</span>
                    </button>
                ))}
            </motion.div>

            {/* ── QUICK MESSAGE ── */}
            <motion.button 
                variants={item}
                onClick={() => navigate('/dashboard/messages')}
                className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-primary-600/20 active:scale-95 transition-transform"
            >
                <MessageSquare size={16} />
                Secure Chat Terminal
            </motion.button>
        </motion.div>
    );
};

export default MobileDashboard;
