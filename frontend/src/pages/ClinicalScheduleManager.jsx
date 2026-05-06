import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { rawBaseURL } from '../api/axiosConfig';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { 
  Calendar, Clock, ChevronRight, Video, MapPin, X, 
  Loader2, Activity, User, ShieldCheck, Clipboard, Search, 
  Target, Filter, Users, CreditCard, Copy, Check, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

const DoctorAppointments = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [activeTab, setActiveTab] = useState('today'); // 'today', 'upcoming', 'past'
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentCard, setShowPaymentCard] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    const fetchAppointments = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const res = await api.get('appointments/my-appointments');
            const data = res.data || [];
            setAppointments(data);
            
            if (location.state?.autoOpenApptId) {
                const apptToOpen = data.find(a => a.id === location.state.autoOpenApptId);
                if (apptToOpen) setSelectedAppt(apptToOpen);
            }

            // Auto-switch tab logic
            const todayStr = new Date().toISOString().split('T')[0];
            const hasToday = (data || []).some(a => a.appointmentDate === todayStr);
            if (!hasToday && (data || []).some(a => a.appointmentDate > todayStr)) {
                setActiveTab('upcoming');
            }
        } catch (e) {
            console.error("Failed to fetch clinical schedule", e);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [location.state?.autoOpenApptId]);

    useEffect(() => {
        fetchAppointments();
        
        // ── Real-time Feature: WebSocket Sync ──
        let stompClient = null;
        const connectWebSocket = () => {
            try {
                const wsUrl = rawBaseURL + '/ws';
                const socket = new SockJS(wsUrl);
                stompClient = Stomp.over(socket);
                stompClient.debug = null; 

                stompClient.connect({
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }, () => {
                    stompClient.subscribe('/user/queue/appointments', (msg) => {
                        const updatedAppt = JSON.parse(msg.body);
                        
                        setAppointments(prev => {
                            const index = prev.findIndex(a => a.id === updatedAppt.id);
                            if (index !== -1) {
                                const newAppts = [...prev];
                                newAppts[index] = { ...newAppts[index], ...updatedAppt };
                                return newAppts;
                            }
                            return [updatedAppt, ...prev];
                        });

                        setSelectedAppt(prev => (prev && prev.id === updatedAppt.id) ? { ...prev, ...updatedAppt } : prev);
                        
                        toast.success(`Schedule Update: ${updatedAppt.patient?.name}'s session is now ${updatedAppt.status}`, {
                            icon: '🔄',
                            duration: 4000
                        });
                    });
                });
            } catch (e) {}
        };

        connectWebSocket();

        const pulseInterval = setInterval(() => {
            fetchAppointments(true);
        }, 60000); 

        return () => {
            clearInterval(pulseInterval);
            if (stompClient) stompClient.disconnect();
        };
    }, [fetchAppointments]);

    const isPastSlot = (apptDate, slot) => {
        try {
            const now = new Date();
            const [time, period] = slot.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            const sessionTime = new Date(apptDate);
            sessionTime.setHours(hours, minutes, 0);
            return (now - sessionTime) / (1000 * 60) > 60;
        } catch (e) { return false; }
    };

    const todayString = new Date().toISOString().split('T')[0];
    const todaysAppointments = (appointments || []).filter(a => a.appointmentDate === todayString && !isPastSlot(a.appointmentDate, a.timeSlot));
    const upcomingAppointments = (appointments || []).filter(a => a.appointmentDate > todayString);
    const pastAppointments = (appointments || []).filter(a => a.appointmentDate < todayString || (a.appointmentDate === todayString && isPastSlot(a.appointmentDate, a.timeSlot)));

    const tabs = [
        { id: 'today', label: 'Today', count: todaysAppointments.length, color: 'emerald' },
        { id: 'upcoming', label: 'Upcoming', count: upcomingAppointments.length, color: 'primary' },
        { id: 'past', label: 'History', count: pastAppointments.length, color: 'slate' }
    ];

    const filterAppointments = (list) => {
        if (!searchTerm) return list;
        const q = searchTerm.toLowerCase();
        return (list || []).filter(a => 
            (a.patient?.name || '').toLowerCase().includes(q) || 
            (a.patient?.email || '').toLowerCase().includes(q) ||
            (a.timeSlot || '').toLowerCase().includes(q)
        );
    };

    return (
        <div className="page-entry space-y-10 pb-12 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                Real-time Sync Active
                            </div>
                            <span className="text-white/20">|</span>
                            <button 
                                onClick={() => fetchAppointments()}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                            >
                                <Activity size={12} />
                                Refresh Pulse
                            </button>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Clinical Pulse</h1>
                        <p className="text-slate-400 font-medium max-w-lg leading-relaxed">
                            Oversight for Dr. {(user?.name || 'Authorized Physician').split(' ').pop()}. Managing {appointments.length} secure clinical sessions across the production timeline.
                        </p>
                    </div>
                </div>
                <Calendar className="absolute -right-12 -bottom-12 text-white/5" size={250} />
            </div>

            {/* Controls Row */}
            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                <div className="flex p-1.5 bg-white rounded-[2rem] border border-slate-200 shadow-sm w-fit max-w-full overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                                activeTab === tab.id 
                                ? 'bg-slate-900 text-white shadow-xl scale-105' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.label}
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] ${
                                activeTab === tab.id 
                                ? `bg-white/20 text-white` 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative w-full xl:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search identities or slots..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-premium pl-12 py-3.5 bg-white border-slate-200"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="animate-in slide-in-from-bottom-4 duration-700">
                    {activeTab === 'today' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filterAppointments(todaysAppointments).length === 0 ? (
                                <EmptySchedule text="No clinical sessions scheduled for today's pulse." />
                            ) : (
                                filterAppointments(todaysAppointments).map(appt => (
                                    <DoctorAppointmentCard 
                                        key={appt.id} 
                                        appt={appt} 
                                        active 
                                        onClick={() => setSelectedAppt(appt)}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'upcoming' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filterAppointments(upcomingAppointments).length === 0 ? (
                                <EmptySchedule text="No future clinical syncs detected in the timeline." />
                            ) : (
                                filterAppointments(upcomingAppointments).map(appt => (
                                    <DoctorAppointmentCard 
                                        key={appt.id} 
                                        appt={appt} 
                                        onClick={() => setSelectedAppt(appt)}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'past' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-75 grayscale-[0.3] hover:grayscale-0 transition-all duration-500">
                            {filterAppointments(pastAppointments).length === 0 ? (
                                <EmptySchedule text="Clinical archive is currently empty for your portal." />
                            ) : (
                                filterAppointments(pastAppointments).map(appt => (
                                    <DoctorAppointmentCard 
                                        key={appt.id} 
                                        appt={appt} 
                                        historical 
                                        onClick={() => setSelectedAppt(appt)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {selectedAppt && (
                <SessionDetailModal 
                    appt={selectedAppt} 
                    onClose={() => setSelectedAppt(null)} 
                    onVerifyClick={() => {
                        setShowPaymentCard(selectedAppt);
                        setSelectedAppt(null);
                    }}
                />
            )}

            {showPaymentCard && (
                <PaymentFloatingCard 
                    appt={showPaymentCard}
                    onVerified={() => {
                        setShowPaymentCard(null);
                        fetchAppointments(true);
                    }}
                    onDismiss={() => setShowPaymentCard(null)}
                />
            )}
        </div>
    );
};

/* --- SUBCOMPONENTS --- */

const DoctorAppointmentCard = ({ appt, onClick, active, historical }) => {
    const { user } = useAuth();
    return (
        <div 
            onClick={onClick}
            className={`group relative perspective-1000 cursor-pointer`}
        >
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${active ? 'from-emerald-500 to-primary' : 'from-slate-200 to-slate-200'} rounded-[2.5rem] blur opacity-10 group-hover:opacity-30 transition duration-500`}></div>
            <div className="relative p-7 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center font-black ${
                            active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                            <div className="text-xl leading-none">{(appt.timeSlot || '--').split(' ')[0]}</div>
                            <div className="text-[9px] uppercase tracking-widest opacity-60 mt-1">{(appt.timeSlot || '--').split(' ')[1] || 'Slot'}</div>
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-lg font-black text-slate-900 truncate">{appt.patient?.name || 'Patient Identity'}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{appt.patient?.email || 'Authorized Link'}</p>
                        </div>
                    </div>
                    {active && (
                       <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Live Now</span>
                       </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-white rounded-xl shadow-sm"><Users size={16} className="text-slate-400" /></div>
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{appt.patient?.name}</p>
                                <p className="text-[10px] font-black text-slate-800 tracking-tight uppercase">Confirmed Patient</p>
                             </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            appt.consultationType === 'ONLINE' ? 'bg-primary/5 text-primary border border-primary/10' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {appt.consultationType}
                          </span>
                       </div>

                       {appt.status === 'AWAITING_VERIFICATION' && (
                          <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1">
                             <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Patient UPI:</span>
                                <span className="text-[9px] font-bold text-slate-700">{appt.patientUpiId || 'Not Provided'}</span>
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Transaction ID:</span>
                                <span className="text-[9px] font-black text-primary uppercase tracking-tighter">{appt.transactionId || 'Not Provided'}</span>
                             </div>
                          </div>
                       )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex -space-x-2">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">R</div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                             {appt.status === 'AWAITING_VERIFICATION' && !user?.institutional && (
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setShowPaymentCard(appt);
                                    }}
                                    className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-500 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                >
                                    <ShieldCheck size={14} /> Verify Payment
                                </button>
                             )}
                             {appt.status === 'AWAITING_VERIFICATION' && user?.institutional && (
                                 <div className="px-4 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-[8px] font-black uppercase tracking-widest border border-slate-200 italic">
                                     Awaiting Admin Auth
                                 </div>
                             )}
                             {appt.consultationType === 'ONLINE' && appt.meetLink && appt.status === 'BOOKED' && (() => {
                                 const isExpired = (() => {
                                     try {
                                         const [time, period] = appt.timeSlot.split(' ');
                                         const [hours, minutes] = time.split(':').map(Number);
                                         let h = hours % 12;
                                         if (period === 'PM') h += 12;
                                         if (period === 'AM' && hours === 12) h = 0;
                                         
                                         const apptDate = new Date(appt.appointmentDate);
                                         apptDate.setHours(h, minutes, 0);
                                         
                                         const now = new Date();
                                         const expiryTime = new Date(apptDate.getTime() + (60 * 60 * 1000));
                                         return now > expiryTime;
                                     } catch (e) { return false; }
                                 })();

                                 return (
                                    <button 
                                        disabled={isExpired}
                                        onClick={(e) => { e.stopPropagation(); window.open(appt.meetLink, '_blank'); }}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-md active:scale-95 flex items-center gap-2 ${
                                            isExpired 
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale' 
                                            : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-200'
                                        }`}
                                    >
                                        <Video size={14} /> {isExpired ? 'Session Concluded' : 'Enter Call'}
                                    </button>
                                 );
                             })()}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/doctor-dashboard/patients/${appt.patient?.id}`;
                                }}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-md active:scale-95"
                            >
                                View History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SessionDetailModal = ({ appt, onClose, onVerifyClick }) => {
    const { user } = useAuth();
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                    <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="relative z-10">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 border border-primary/20">
                        <Calendar size={28} />
                    </div>

                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Clinical Protocol</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-8">Session Details & Metadata</p>

                    <div className="space-y-6">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center">
                                {appt.patient?.profilePictureUrl ? (
                                    <img 
                                        src={appt.patient.profilePictureUrl} 
                                        alt={appt.patient.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img 
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appt.patient?.email || appt.patient?.id}`} 
                                        alt="Avatar"
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-0.5">Patient Identity</p>
                                <p className="text-xl font-black text-slate-900">{appt.patient?.name}</p>
                                <p className="text-xs font-bold text-slate-400">{appt.patient?.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                    <Clock size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Time Slot</span>
                                </div>
                                <p className="text-lg font-black text-slate-800 leading-none mb-1">{appt.timeSlot}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{appt.appointmentDate}</p>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                    <Target size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Status</span>
                                </div>
                                <p className={`text-lg font-black leading-none mb-1 ${
                                    appt.status === 'BOOKED' ? 'text-emerald-600' : 'text-amber-600'
                                }`}>
                                    {appt.status.replace(/_/g, ' ')}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{appt.consultationType} Protocol</p>
                            </div>
                        </div>

                        {appt.status === 'AWAITING_VERIFICATION' && (
                            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-3">
                                <div className="flex items-center gap-2 text-amber-700">
                                    <ShieldCheck size={18} />
                                    <span className="text-xs font-black uppercase tracking-widest">Awaiting Verification</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-medium">Patient UPI ID: <span className="font-bold text-slate-700">{appt.patientUpiId}</span></p>
                                    <p className="text-[10px] text-slate-500 font-medium">Transaction Reference: <span className="font-bold text-slate-700">{appt.transactionId}</span></p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-100 flex gap-4">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/doctor-dashboard/patients/${appt.patient?.id}`;
                            }}
                            className="flex-1 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-primary transition-all active:scale-[0.98]"
                        >
                            Review Medical Dossier
                        </button>
                        <button onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">
                            Close
                        </button>
                    </div>
                    
                    {appt.status === 'AWAITING_VERIFICATION' && !user?.institutional && (
                        <button 
                            onClick={onVerifyClick}
                            className="w-full mt-3 py-4 bg-amber-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg hover:bg-amber-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <ShieldCheck size={16} /> Verify & Confirm Payment
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const PaymentFloatingCard = ({ appt, onVerified, onDismiss }) => {
    const [verifying, setVerifying] = useState(false);
    const [copied, setCopied] = useState(null);

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(field);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    const handleVerify = async () => {
        setVerifying(true);
        try {
            await api.post('appointments/confirm-upi', { appointmentId: appt.id });
            toast.success('Payment verified. Clinical slot confirmed!');
            onVerified();
        } catch (e) {
            toast.error('Verification failed. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[600] w-[340px] animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] border border-amber-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                            <CreditCard className="text-amber-600" size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Verification Pending</p>
                            <p className="text-xs font-bold text-slate-700">Payment Protocol</p>
                        </div>
                    </div>
                    <button onClick={onDismiss} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={14} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-primary-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Slot</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{appt.timeSlot}</span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                            <ExternalLink size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">UPI ID</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800 tracking-tighter">{appt.patientUpiId || 'NO_ID'}</span>
                            <button onClick={() => copyToClipboard(appt.patientUpiId, 'upi')} className="p-1 hover:bg-white rounded-md transition-colors">
                                {copied === 'upi' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 bg-slate-900 rounded-2xl p-4 text-white">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Transaction ID</span>
                            <button onClick={() => copyToClipboard(appt.transactionId, 'tx')} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                {copied === 'tx' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-white/40" />}
                            </button>
                        </div>
                        <p className="text-sm font-black tracking-widest break-all font-mono text-emerald-400">{appt.transactionId || 'NOT_FOUND'}</p>
                    </div>

                    <button 
                        disabled={verifying}
                        onClick={handleVerify}
                        className="w-full py-4 bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:bg-amber-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                        {verifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                        {verifying ? 'Authenticating...' : 'Authorize Transaction'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EmptySchedule = ({ text }) => (
    <div className="col-span-full py-32 bg-slate-100/30 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-10">
        <div className="p-8 bg-white rounded-[2rem] shadow-sm mb-6 text-slate-200">
            <Clipboard size={64} />
        </div>
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.25em] mb-2">{text}</h3>
        <p className="text-[10px] text-slate-400 font-medium">All clinical telemetry is synchronized.</p>
    </div>
);

export default DoctorAppointments;
