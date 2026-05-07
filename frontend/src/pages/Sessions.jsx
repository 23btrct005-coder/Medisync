import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api, { rawBaseURL } from '../api/axiosConfig';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { Calendar, Clock, ChevronRight, Video, MapPin, X, Loader2, AlertCircle, History as HistoryIcon, ShieldCheck, CreditCard, CheckCircle2, Copy, ExternalLink, Activity } from 'lucide-react';
import ClinicMap from '../components/ClinicMap';
import toast from 'react-hot-toast';

/* --- SUBCOMPONENTS --- */

const EmptyState = ({ icon, text }) => (
    <div className="text-center py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="p-6 bg-white rounded-full shadow-sm text-slate-200">
            {icon && React.isValidElement(icon) ? React.cloneElement(icon, { size: 48 }) : icon}
        </div>
        <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{text}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Telemetry synchronization completed.</p>
        </div>
    </div>
);

const SessionCard = ({ appt, onClick, active, historical, canEnter, onRate }) => {
    return (
        <div 
            onClick={historical ? undefined : onClick}
            className={`p-4 rounded-3xl border flex items-center gap-4 cursor-pointer transition-all group ${
                active 
                ? 'bg-primary-50 border-primary-200 hover:shadow-lg shadow-primary-500/20' 
                : 'bg-white border-slate-200 hover:border-primary-300 hover:shadow-md'
            }`}
        >
            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 ${
                active ? 'bg-primary-600 text-white shadow-inner' : 
                historical ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-700'
            }`}>
                <div className="text-sm">{appt.appointmentDate?.split('-')[2]}</div>
                <div className="text-[9px] uppercase tracking-wider">{new Date(appt.appointmentDate).toLocaleString('en-US', { month: 'short' })}</div>
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className={`text-base font-extrabold truncate ${historical ? 'text-slate-500' : 'text-slate-800'}`}>
                    {appt.serviceName ? appt.serviceName : `Dr. ${appt.doctor?.name}`}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                    <p className={`text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1 ${active ? 'text-primary-700' : 'text-slate-400'}`}>
                        <Clock size={10} /> {appt.timeSlot}
                    </p>
                    {appt.status !== 'PENDING' && (
                        <p className={`text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1 ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {appt.consultationType === 'ONLINE' ? <Video size={10} /> : <MapPin size={10} />}
                            {appt.consultationType}
                        </p>
                    )}
                    {appt.status === 'PENDING' && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                           Awaiting Confirmation
                        </p>
                    )}
                    {appt.status === 'AWAITING_VERIFICATION' && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                           Awaiting Verification
                        </p>
                    )}
                </div>
            </div>

            {historical && !appt.rated && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onRate(); }}
                    className="px-4 py-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-primary-700 transition-colors"
                >
                    Rate
                </button>
            )}
            {historical && appt.rated && (
                <div className="px-4 py-2 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200">
                    Feedback Received
                </div>
            )}
            {!historical && (
                <div className={`p-2 rounded-xl border border-slate-200 transition-colors ${
                    active ? 'bg-white text-primary-600' : 'bg-slate-50 text-slate-400 group-hover:text-primary-600 group-hover:border-primary-200'
                }`}>
                    <ChevronRight size={18} />
                </div>
            )}
        </div>
    );
};

// ─── Payment Verification Floating Card ───────────────────────────────────────
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
            await api.post(`/appointments/${appt.id}/verify-payment`);
            toast.success('Payment verified. Appointment confirmed!');
            onVerified();
        } catch (e) {
            toast.error('Verification failed. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const parsedFees = appt.doctor?.serviceFees
        ? (typeof appt.doctor.serviceFees === 'string' ? JSON.parse(appt.doctor.serviceFees) : appt.doctor.serviceFees)
        : null;
    const fee = parsedFees?.[appt.consultationType === 'ONLINE' ? 'Telemedicine' : 'General Consultation'];

    return (
        <div className="fixed bottom-6 right-6 z-[600] w-[340px] animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] border border-amber-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                            <CreditCard className="text-amber-600" size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Payment Pending</p>
                            <p className="text-xs font-bold text-slate-700">Awaiting Verification</p>
                        </div>
                    </div>
                    <button onClick={onDismiss} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                    {/* Slot Time */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-primary-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Booked Slot</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">
                            {appt.appointmentDate} • {appt.timeSlot}
                        </span>
                    </div>

                    {/* UPI ID */}
                    {appt.patientUpiId && (
                        <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <ExternalLink size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">UPI ID</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{appt.patientUpiId}</span>
                                <button
                                    onClick={() => copyToClipboard(appt.patientUpiId, 'upi')}
                                    className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    <Copy size={12} className={copied === 'upi' ? 'text-emerald-500' : 'text-slate-400'} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Transaction ID */}
                    {appt.transactionId && (
                        <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Txn ID</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{appt.transactionId}</span>
                                <button
                                    onClick={() => copyToClipboard(appt.transactionId, 'txn')}
                                    className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    <Copy size={12} className={copied === 'txn' ? 'text-emerald-500' : 'text-slate-400'} />
                                </button>
                            </div>
                        </div>
                    )}

                    {fee && (
                        <div className="flex items-center justify-between bg-emerald-50 rounded-2xl px-4 py-3 border border-emerald-100">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Amount</span>
                            <span className="text-sm font-black text-emerald-700">₹{fee}</span>
                        </div>
                    )}

                    {!appt.patientUpiId && !appt.transactionId && (
                        <div className="bg-amber-50 rounded-2xl px-4 py-3 text-center border border-amber-100">
                            <p className="text-[10px] font-bold text-amber-600">Payment details not submitted yet.</p>
                        </div>
                    )}
                </div>

                {/* Verify Button */}
                <div className="px-5 pb-5">
                    <button
                        onClick={handleVerify}
                        disabled={verifying}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {verifying ? (
                            <><Loader2 size={14} className="animate-spin" /> Verifying...</>
                        ) : (
                            <><CheckCircle2 size={14} /> Confirm Payment</>  
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RatingModal = ({ appt, onClose, onRatingSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await api.post('ratings', {
                appointmentId: appt.id,
                stars: rating,
                comment: comment
            });
            onRatingSubmitted();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Feedback submission failed. Protocol interrupted.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Physician Feedback</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rate Dr. {appt.doctor?.name}</p>
                </div>

                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button 
                            key={star} 
                            onClick={() => setRating(star)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                                rating >= star ? 'bg-amber-400 text-white shadow-lg scale-110' : 'bg-slate-100 text-slate-300'
                            }`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Provide clinical feedback (optional)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 mb-8"
                    rows={4}
                />

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Abort</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitting}
                        className="flex-1 py-4 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-700 disabled:opacity-50"
                    >
                        {submitting ? 'Syncing...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SessionDetailModal = ({ appt, onClose, canEnter }) => {
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500 px-4 sm:px-0">
            <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border border-white relative animate-in zoom-in-95 duration-500">
                <div className="p-6 sm:p-8">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                    
                    <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mb-6 border border-primary-100">
                        <Calendar size={28} />
                    </div>

                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1 text-gradient">Session Protocol</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-8">Metadata & Clinical Authorization</p>

                    <div className="space-y-4">
                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 flex items-center gap-4 hover:border-primary-200 transition-colors group/doc">
                            <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden shrink-0 group-hover/doc:scale-105 transition-transform flex items-center justify-center">
                                {appt.serviceName ? (
                                    <Activity className="text-primary-500" size={24} />
                                ) : (
                                    <img src={appt.doctor?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${appt.doctor?.name}`} alt="" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase text-primary-600 tracking-widest mb-0.5">
                                    {appt.serviceName ? 'Medical Service' : 'Attending Physician'}
                                </p>
                                <p className="text-lg font-black text-slate-900 truncate">
                                    {appt.serviceName ? appt.serviceName : `Dr. ${appt.doctor?.name}`}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1"><Clock size={10} /> Schedule</p>
                                <p className="text-sm font-extrabold text-slate-800">{appt.appointmentDate}</p>
                                <p className="text-xs font-medium text-slate-500">{appt.timeSlot}</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1"><Video size={10} /> Modality</p>
                                <p className="text-sm font-extrabold text-slate-800">{appt.consultationType}</p>
                                <p className="text-xs font-black uppercase tracking-widest mt-1">
                                    <span className={
                                        appt.status === 'PENDING' ? 'text-amber-500' : 
                                        appt.status === 'AWAITING_VERIFICATION' ? 'text-blue-500' : 
                                        'text-emerald-500'
                                    }>{appt.status.replace(/_/g, ' ')}</span>
                                </p>
                            </div>
                        </div>

                        {appt.status === 'BOOKED' && appt.consultationType === 'OFFLINE' && (appt.doctor?.clinicAddress || appt.hospital?.address) && (
                            <div className="space-y-4">
                                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1 flex items-center gap-1"><MapPin size={10} /> {appt.hospital ? 'Facility Location' : 'Clinic Address'}</p>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                        {appt.doctor?.clinicAddress || appt.hospital?.address}
                                    </p>
                                </div>
                                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                    <ClinicMap 
                                        address={appt.doctor?.clinicAddress || appt.hospital?.address} 
                                        hospitalName={appt.hospital ? appt.hospital.name : `Dr. ${appt.doctor?.name}`}
                                        height="200px" 
                                    />
                                </div>
                            </div>
                        )}
                        {appt.status === 'PENDING' && (
                           <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl text-center space-y-2">
                               <AlertCircle size={24} className="text-amber-500 mx-auto" />
                               <p className="text-sm font-bold text-slate-800">Payment Pending</p>
                               <p className="text-xs text-slate-500 font-medium leading-relaxed">Exact session coordinates and communication links will activate immediately upon clinical confirmation.</p>
                           </div>
                        )}
                        {appt.status === 'AWAITING_VERIFICATION' && (
                           <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl text-center space-y-2">
                               <ShieldCheck size={24} className="text-blue-500 mx-auto" />
                               <p className="text-sm font-bold text-slate-800">Awaiting Physician Verification</p>
                               <p className="text-xs text-slate-500 font-medium leading-relaxed">Your UPI payment has been registered. The attending physician will verify the transaction and confirm your slot shortly.</p>
                           </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                        {appt.status === 'BOOKED' && appt.consultationType === 'ONLINE' && appt.status !== 'FAILED' && appt.meetLink && (() => {
                            const now = new Date();
                            const [time, period] = appt.timeSlot.split(' ');
                            let [hours, minutes] = time.split(':').map(Number);
                            if (period === 'PM' && hours !== 12) hours += 12;
                            if (period === 'AM' && hours === 12) hours = 0;
                            
                            const sessionTime = new Date(appt.appointmentDate);
                            sessionTime.setHours(hours, minutes, 0);
                            
                            const diffMinutes = (sessionTime - now) / (1000 * 60);
                            const isTooEarly = diffMinutes > 10;
                            const isExpired = diffMinutes < -60;

                            if (isExpired) {
                                return (
                                    <div className="flex-1 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center text-center p-3 border border-slate-200">
                                        Session Concluded
                                    </div>
                                );
                            }

                            if (isTooEarly) {
                                return (
                                    <div className="flex-1 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center text-center p-3 border border-slate-200">
                                        Link activates 10m before
                                    </div>
                                );
                            }

                            return (
                                <button 
                                    onClick={() => window.open(appt.meetLink, '_blank')}
                                    className="flex-1 btn-premium bg-emerald-600 text-white shadow-xl hover:bg-emerald-700 text-sm py-3 flex items-center justify-center gap-2 border-none"
                                >
                                    <Video size={16} /> Enter Call
                                </button>
                            );
                        })()}
                        <button onClick={onClose} className="flex-1 btn-premium bg-slate-900 text-white shadow-2xl hover:bg-slate-800 border-none text-sm py-4 animate-pulse-soft">
                            Acknowledge
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Sessions = () => {
    const location = useLocation();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [activeTab, setActiveTab] = useState('today');
    const [activeCategory, setActiveCategory] = useState('physician');
    const [showRatingModal, setShowRatingModal] = useState(null);
    const [showPaymentCard, setShowPaymentCard] = useState(null);

    const fetchAppointments = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const res = await api.get('/appointments/my-appointments');
            const data = res.data || [];
            setAppointments(data);
            
            if (location.state?.autoOpenId) {
                const appt = data.find(a => a.id === location.state.autoOpenId);
                if (appt) setSelectedAppt(appt);
            }

            // Auto-switch tab logic
            const d = new Date();
            const todayStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
            const hasToday = data.some(a => a.appointmentDate === todayStr);
            if (!hasToday && data.some(a => a.appointmentDate > todayStr)) {
                setActiveTab('upcoming');
            }
        } catch (e) {
            console.error("Failed to fetch clinical timeline", e);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [location.state?.autoOpenId]);

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
                        
                        toast.success(`Update: Your session status is now ${updatedAppt.status}`, {
                            icon: '✅',
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

    const isCallActive = (apptDate, slot) => {
        try {
            const now = new Date();
            const [time, period] = slot.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            const sessionTime = new Date(apptDate);
            sessionTime.setHours(hours, minutes, 0);
            const diffMinutes = (sessionTime - now) / (1000 * 60);
            return diffMinutes <= 10 && diffMinutes >= -60;
        } catch (e) { return false; }
    };

    const d = new Date();
    const todayString = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    
    const safeAppointments = Array.isArray(appointments) ? appointments : [];
    const categoryAppointments = safeAppointments.filter(a => 
        activeCategory === 'service' ? !!a.serviceName : !a.serviceName
    );

    const activeAppts = categoryAppointments.filter(a => a.status === 'BOOKED');
    const pendingAppointments = categoryAppointments.filter(a => a.status === 'PENDING' || a.status === 'AWAITING_VERIFICATION');
    
    const todaysAppointments = activeAppts.filter(a => a.appointmentDate === todayString && !isPastSlot(a.appointmentDate, a.timeSlot));
    const pastAppointments = activeAppts.filter(a => a.appointmentDate < todayString || (a.appointmentDate === todayString && isPastSlot(a.appointmentDate, a.timeSlot)));
    const upcomingAppointments = activeAppts.filter(a => a.appointmentDate > todayString);

    const tabs = [
        { id: 'today', label: 'Today', count: todaysAppointments.length, color: 'emerald' },
        { id: 'pending', label: 'Pending', count: pendingAppointments.length, color: 'amber' },
        { id: 'upcoming', label: 'Upcoming', count: upcomingAppointments.length, color: 'primary' },
        { id: 'past', label: 'History', count: pastAppointments.length, color: 'slate' }
    ];

    return (
        <div className="page-entry space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
                        <Activity size={14} /> Clinical Schedule
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        My Appointments
                    </h2>
                    <p className="text-slate-500 font-medium mt-2 max-w-xl">
                        Monitor and access your secure physician consultations across the clinical timeline.
                    </p>
                </div>
            </div>

            {/* Category and Tab Navigation */}
            <div className="flex flex-col gap-6">
                <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveCategory('physician')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                            activeCategory === 'physician'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Consultations
                    </button>
                    <button
                        onClick={() => setActiveCategory('service')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                            activeCategory === 'service'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Medical Services
                    </button>
                </div>

                <div className="flex p-1.5 bg-slate-100 rounded-[2rem] border border-slate-200 shadow-inner w-fit max-w-full overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                            activeTab === tab.id 
                            ? 'bg-white text-slate-900 shadow-xl scale-105' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] ${
                            activeTab === tab.id 
                            ? `bg-${tab.color}-100 text-${tab.color}-600` 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm border-dashed">
                    <Loader2 size={48} className="animate-spin text-primary-500 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[10px]">Synchronizing Protocol...</p>
                </div>
            ) : (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'today' && (
                        <div className="space-y-6">
                            {todaysAppointments.length === 0 ? (
                                <EmptyState icon={<Clock />} text="No consultations scheduled for today." />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {todaysAppointments.map(appt => (
                                        <SessionCard key={appt.id} appt={appt} onClick={() => setSelectedAppt(appt)} active canEnter={isCallActive(appt.appointmentDate, appt.timeSlot)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'pending' && (
                        <div className="space-y-6">
                            {pendingAppointments.length === 0 ? (
                                <EmptyState icon={<Clock className="text-amber-400" />} text="No pending clinical sessions detected." />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {pendingAppointments.map(appt => (
                                        <SessionCard
                                            key={appt.id}
                                            appt={appt}
                                            onClick={() => {
                                                if (appt.status === 'AWAITING_VERIFICATION') {
                                                    setShowPaymentCard(appt);
                                                } else {
                                                    setSelectedAppt(appt);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'upcoming' && (
                        <div className="space-y-6">
                            {upcomingAppointments.length === 0 ? (
                                <EmptyState icon={<Calendar />} text="No future clinical syncs detected." />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {upcomingAppointments.map(appt => (
                                        <SessionCard key={appt.id} appt={appt} onClick={() => setSelectedAppt(appt)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'past' && (
                        <div className="space-y-6">
                            {pastAppointments.length === 0 ? (
                                <EmptyState icon={<HistoryIcon />} text="Clinical archive is currently empty." />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                                    {pastAppointments.map(appt => (
                                        <SessionCard key={appt.id} appt={appt} onClick={() => setSelectedAppt(appt)} historical onRate={() => setShowRatingModal(appt)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {selectedAppt && (
                <SessionDetailModal 
                    appt={selectedAppt} 
                    onClose={() => setSelectedAppt(null)} 
                    canEnter={isCallActive(selectedAppt.appointmentDate, selectedAppt.timeSlot)}
                />
            )}
            
            {showRatingModal && (
                <RatingModal appt={showRatingModal} onClose={() => setShowRatingModal(null)} onRatingSubmitted={fetchAppointments} />
            )}

            {showPaymentCard && (
                <PaymentFloatingCard
                    appt={showPaymentCard}
                    onVerified={() => { setShowPaymentCard(null); fetchAppointments(true); }}
                    onDismiss={() => setShowPaymentCard(null)}
                />
            )}
        </div>
    );
};

export default Sessions;
