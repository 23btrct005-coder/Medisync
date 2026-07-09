import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, ChevronRight, Activity, Droplet, MapPin, ShieldCheck, X, ExternalLink, CreditCard } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import api, { rawBaseURL } from '../api/axiosConfig';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import toast from 'react-hot-toast';

const HospitalAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');
    const [statusFilter, setStatusFilter] = useState('');
    const [showVerifyModal, setShowVerifyModal] = useState(null);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [apptRes, profileRes] = await Promise.all([
                api.get('/hospital/appointments'),
                api.get('/hospital/profile')
            ]);
            setAppointments(apptRes.data);
            setHospitalInfo(profileRes.data?.hospital);
        } catch (err) {
            if (!isSilent) toast.error("Failed to sync institutional ledger");
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

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
                        
                        toast.success(`Institutional Ledger Update: Session ${updatedAppt.id} is now ${updatedAppt.status}`, {
                            icon: '🏢',
                            duration: 4000
                        });
                    });
                });
            } catch (e) {}
        };

        connectWebSocket();

        const pulseInterval = setInterval(() => {
            fetchData(true);
        }, 60000);

        return () => {
            clearInterval(pulseInterval);
            if (stompClient && stompClient.connected) {
                try { stompClient.disconnect(); } catch (e) {}
            }
        };
    }, [fetchData]);

    const handleVerify = async (apptId) => {
        try {
            await api.post('/appointments/confirm-upi', { appointmentId: apptId });
            toast.success("Payment verified. Clinical slot booked.");
            setShowVerifyModal(null);
            fetchData(true);
        } catch (e) {
            toast.error("Verification failed");
        }
    };

    const filteredAppointments = (Array.isArray(appointments) ? appointments : [])
        .filter(app => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = app.patient?.name?.toLowerCase().includes(searchLower) ||
                                app.doctor?.name?.toLowerCase().includes(searchLower) ||
                                app.serviceName?.toLowerCase().includes(searchLower);
            const matchesStatus = statusFilter ? app.status === statusFilter : true;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'date-desc') return new Date(b.appointmentDate) - new Date(a.appointmentDate);
            if (sortBy === 'date-asc') return new Date(a.appointmentDate) - new Date(b.appointmentDate);
            if (sortBy === 'patient-asc') return (a.patient?.name || '').localeCompare(b.patient?.name || '');
            return 0;
        });

    const bloodStock = hospitalInfo?.bloodStock ? JSON.parse(hospitalInfo.bloodStock) : {};

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Activity className="animate-spin text-primary" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synchronizing Institutional Records...</p>
            </div>
        );
    }

    return (
        <div className="p-8 animate-in fade-in duration-500 space-y-8 pb-32">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight italic">Institutional <span className="not-italic text-primary">Pulse</span></h1>
                    <div className="flex items-center gap-2 mt-2 ml-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Real-time Cross-departmental orchestration active</p>
                    </div>
                </div>
                <div className="xl:w-[60%]">
                    <FilterBar 
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        placeholder="Filter ledger by patient, doctor, service, or date..."
                        sortValue={sortBy}
                        onSortChange={setSortBy}
                        sortOptions={[
                            { label: 'Date (Newest)', value: 'date-desc' },
                            { label: 'Date (Oldest)', value: 'date-asc' },
                            { label: 'Patient (A-Z)', value: 'patient-asc' }
                        ]}
                        filters={[
                            {
                                key: 'status',
                                label: 'All Statuses',
                                value: statusFilter,
                                options: [
                                    { label: 'Confirmed', value: 'BOOKED' },
                                    { label: 'Awaiting Verification', value: 'AWAITING_VERIFICATION' },
                                    { label: 'Pending', value: 'PENDING' },
                                    { label: 'Completed', value: 'COMPLETED' },
                                    { label: 'Cancelled', value: 'CANCELLED' }
                                ]
                            }
                        ]}
                        onFilterChange={(key, val) => setStatusFilter(val)}
                    />
                </div>
            </div>
                
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Emergency', count: appointments.filter(a => a.serviceName?.includes('Emergency') || a.serviceName?.includes('Trauma') || a.serviceName?.includes('Ambulance')).length, color: 'text-red-500', bg: 'bg-red-50' },
                    { label: 'Diagnostics', count: appointments.filter(a => a.serviceName?.includes('Scan') || a.serviceName?.includes('Test') || a.serviceName?.includes('X-Ray')).length, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Specialized', count: appointments.filter(a => a.doctor?.specialization && a.doctor.specialization !== 'General Medicine').length, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'General', count: appointments.filter(a => !a.serviceName && (!a.doctor?.specialization || a.doctor.specialization === 'General Medicine')).length, color: 'text-slate-500', bg: 'bg-slate-50' }
                ].map((stat, i) => (
                    <div key={i} className={`p-6 rounded-[2rem] ${stat.bg} border border-slate-100 flex flex-col gap-1`}>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${stat.color}`}>{stat.label} Traffic</span>
                        <span className="text-3xl font-black text-slate-900">{stat.count}</span>
                    </div>
                ))}
            </div>

            {/* Blood Bank Triage Summary */}
            {Object.keys(bloodStock).length > 0 && (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 text-[9px] font-black uppercase tracking-[0.2em]">
                                <Droplet size={12} /> Blood Bank Triage
                            </div>
                            <h2 className="text-2xl font-black">Live Inventory Status</h2>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-4 w-full md:w-auto">
                            {Object.entries(bloodStock).map(([group, stock]) => (
                                <div key={group} className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[70px]">
                                    <span className="text-xl font-black text-white">{group}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${stock > 5 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stock} Units
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                {filteredAppointments.map((app) => (
                    <div key={app.id} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                           <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                               app.status === 'BOOKED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                               app.status === 'AWAITING_VERIFICATION' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                               app.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                               'bg-slate-50 text-slate-400 border-slate-100'
                           }`}>
                               {app.status.replace(/_/g, ' ')}
                           </div>
                        </div>

                        <div className="flex items-center gap-6 mb-10">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 transition-colors">
                                <User className="text-slate-300 group-hover:text-primary transition-colors" size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 leading-none mb-1">{app.patient?.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{app.serviceName || 'Clinical Consultation'}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Calendar className="text-slate-400" size={16} />
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{app.appointmentDate}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="text-slate-400" size={16} />
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{app.timeSlot}</span>
                                </div>
                            </div>

                            {/* Emergency Location Capture */}
                            {(app.latitude && app.longitude) && (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="text-emerald-500" size={16} />
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Patient Deployment Site</span>
                                            <span className="text-[10px] font-mono font-black text-emerald-800">{app.latitude.toFixed(6)}, {app.longitude.toFixed(6)}</span>
                                        </div>
                                    </div>
                                    <a 
                                        href={`https://www.google.com/maps?q=${app.latitude},${app.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-white rounded-xl shadow-sm hover:bg-emerald-500 hover:text-white transition-all text-emerald-600"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            )}

                            {app.doctor && (
                                <div className="flex items-center gap-3 px-2">
                                    <ShieldCheck className="text-slate-300" size={14} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Specialist: Dr. {app.doctor.name}</span>
                                </div>
                            )}
                        </div>

                        {app.status === 'AWAITING_VERIFICATION' && (
                            <button 
                                onClick={() => setShowVerifyModal(app)}
                                className="w-full py-4 bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:bg-amber-700 transition-all active:scale-[0.98]"
                            >
                                Authorize Transaction
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Verification Modal */}
            {showVerifyModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => setShowVerifyModal(null)} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative z-10 space-y-8">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center border border-amber-200">
                                <CreditCard size={28} />
                            </div>

                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Payment Audit</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Administrative Verification Protocol</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient UPI</span>
                                        <span className="text-xs font-black text-slate-800">{showVerifyModal.patientUpiId}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</span>
                                        <span className="text-xs font-black text-primary font-mono">{showVerifyModal.transactionId}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Payable</span>
                                        <span className="text-xl font-black text-slate-900">₹{showVerifyModal.amount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => handleVerify(showVerifyModal.id)}
                                    className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all active:scale-[0.98]"
                                >
                                    Confirm & Book
                                </button>
                                <button 
                                    onClick={() => setShowVerifyModal(null)}
                                    className="px-8 py-5 bg-slate-100 text-slate-400 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {filteredAppointments.length === 0 && (
                <div className="col-span-full py-40 bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-10">
                    <Activity size={64} className="text-slate-200 mb-6" />
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.25em] mb-2">No Institutional Pulse Detected</h3>
                    <p className="text-[10px] text-slate-400 font-medium">All clinical streams are currently idle.</p>
                </div>
            )}
        </div>
    );
};

export default HospitalAppointments;
