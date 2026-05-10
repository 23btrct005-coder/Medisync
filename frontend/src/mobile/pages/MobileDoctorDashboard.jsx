import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Camera, Zap, Users, Calendar, MessageSquare, 
  Search, ShieldCheck, Activity, ChevronRight,
  Clock, UserPlus, Globe, Star, QrCode, X, ChevronDown
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MobileDoctorDashboard = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [patientIdInput, setPatientIdInput] = useState('');
    const [addingPatient, setAddingPatient] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDoctorData = async () => {
            try {
                const [reqsRes, apptsRes] = await Promise.all([
                    api.get('doctor/requests'),
                    api.get('/appointments/my-appointments')
                ]);
                setRequests(reqsRes.data || []);
                setAppointments(apptsRes.data || []);
            } catch (err) {
                console.error("Doctor sync failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctorData();
    }, []);

    const handleAddPatient = async () => {
        if (!patientIdInput.trim()) return toast.error('Please provide a Patient ID');
        setAddingPatient(true);
        try {
            const res = await api.get(`doctor/patient-by-code/${patientIdInput.trim()}`);
            if (res.data && res.data.patientId) {
                toast.success('Patient Identity Verified');
                // The endpoint returns details including if they are linked
                // We navigate to their profile
                navigate(`/doctor-dashboard/patients/${res.data.id}`);
            } else {
                toast.error('Clinical ID not found in registry');
            }
        } catch (err) {
            if (err.response?.status === 404) {
                toast.error('Clinical ID not found in registry');
            } else {
                toast.error('Protocol connection failed');
            }
        } finally {
            setAddingPatient(false);
            setShowAddModal(false);
        }
    };

    const todayAppts = appointments.filter(a => {
        const d = new Date(a.appointmentDate);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
    }).sort((a,b) => a.timeSlot.localeCompare(b.timeSlot));

    const nextPatient = todayAppts[0];

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[70vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-emerald-500">
                <Activity size={40} />
            </motion.div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Physician Node...</p>
        </div>
    );

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            
            {/* ── PRIMARY CLINICAL TRIGGER ── */}
            <motion.div variants={item} className="grid grid-cols-1 gap-3">
                <button 
                    onClick={() => navigate('/doctor-dashboard?scan=true')} 
                    className="w-full bg-[#0A1A1A] p-6 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-transform relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1">Optical Sync</p>
                        <h2 className="text-xl font-black tracking-tight leading-none uppercase">Scan Patient</h2>
                    </div>
                    <div className="h-14 w-14 bg-emerald-500 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-emerald-500/40 relative z-10">
                        <QrCode size={28} className="text-[#0A1A1A]" />
                    </div>
                    <Activity size={140} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
                </button>

                <button 
                    onClick={() => setShowAddModal(true)} 
                    className="w-full bg-white border border-slate-200 p-6 rounded-[2.5rem] text-slate-900 flex items-center justify-between active:scale-[0.98] transition-transform shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-primary-50 text-primary-600 rounded-[1.25rem] flex items-center justify-center">
                            <UserPlus size={28} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-600 mb-1">Registry Manual</p>
                            <h2 className="text-xl font-black tracking-tight leading-none uppercase">Add Patient</h2>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </button>
            </motion.div>

            {/* ── QUICK LOOKUP ACTION ── */}
            <motion.div variants={item} className="flex gap-3">
                <button 
                    onClick={() => navigate('/doctor-dashboard/patients')}
                    className="flex-1 bg-white p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-3 active:bg-slate-50 transition-colors shadow-sm"
                >
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Registry</span>
                </button>
                <button 
                    onClick={() => navigate('/doctor-dashboard/appointments')}
                    className="flex-1 bg-white p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-3 active:bg-slate-50 transition-colors shadow-sm"
                >
                    <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Calendar size={24} />
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Schedule</span>
                </button>
            </motion.div>

            {/* ── NEXT SUBJECT PROTOCOL ── */}
            {nextPatient && (
                <motion.div variants={item} className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Active Queue</h3>
                    <div 
                        onClick={() => navigate(`/doctor-dashboard/patients/${nextPatient.patient?.id}`)}
                        className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform border-l-4 border-l-emerald-500"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl">
                                {nextPatient.patient?.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Next Patient</p>
                                <h4 className="text-base font-black text-slate-800 leading-tight">{nextPatient.patient?.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock size={10} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500">{nextPatient.timeSlot}</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── CLINICAL SIGNALS ── */}
            <motion.div variants={item} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorization Stream</h3>
                    {requests.filter(r => r.status === 'PENDING').length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest animate-pulse">
                            {requests.filter(r => r.status === 'PENDING').length} Signals
                        </span>
                    )}
                </div>
                <div className="space-y-2">
                    {requests.slice(0, 3).map((req, i) => (
                        <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                                    <Zap size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-800 leading-none">Access Request</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-1 truncate max-w-[120px]">
                                        {req.patient?.email || 'Secured Node'}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase shrink-0 ${
                                req.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                                {req.status}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── MESSAGING FAB ── */}
            <motion.button 
                variants={item}
                onClick={() => navigate('/doctor-dashboard/messages')}
                className="w-full py-5 bg-emerald-500 text-[#0A1A1A] rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform"
            >
                <MessageSquare size={16} />
                Clinical Message Terminal
            </motion.button>

            {/* ── ADD PATIENT MODAL ── */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-100 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6">
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="h-20 w-20 bg-primary-50 text-primary-600 rounded-[2rem] flex items-center justify-center mb-6">
                                    <QrCode size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Onboard Patient</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 mb-8">Scan QR or Enter Patient ID</p>

                                <div className="w-full space-y-4">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="ENTER CLINICAL ID"
                                            value={patientIdInput}
                                            onChange={(e) => setPatientIdInput(e.target.value.toUpperCase())}
                                            className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-center text-xl font-black tracking-[0.3em] text-slate-900 focus:border-primary-500 outline-none transition-all placeholder:text-slate-300 placeholder:tracking-widest"
                                        />
                                    </div>
                                    <button 
                                        disabled={addingPatient}
                                        onClick={handleAddPatient}
                                        className="w-full h-16 bg-[#0A1A1A] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {addingPatient ? <Activity className="animate-spin" size={18} /> : <Zap size={18} className="text-emerald-400" />}
                                        {addingPatient ? 'Syncing...' : 'Link Identity'}
                                    </button>
                                    <div className="flex items-center gap-4 py-2">
                                        <div className="h-px flex-1 bg-slate-100" />
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">OR</span>
                                        <div className="h-px flex-1 bg-slate-100" />
                                    </div>
                                    <button 
                                        onClick={() => { setShowAddModal(false); navigate('/doctor-dashboard?scan=true'); }}
                                        className="w-full h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border border-emerald-100 active:scale-95 transition-all"
                                    >
                                        <Camera size={18} />
                                        Optical Scanner
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MobileDoctorDashboard;
