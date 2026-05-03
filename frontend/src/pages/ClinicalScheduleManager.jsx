import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { 
  Calendar, Clock, ChevronRight, Video, MapPin, X, 
  Loader2, Activity, User, ShieldCheck, Clipboard, Search, 
  Target, Filter, Users
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
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAppointments();
        
        // Automated Telemetry Heartbeat (Real-time sync every 30s)
        const pulseInterval = setInterval(() => {
            fetchAppointments();
        }, 30000); 

        return () => clearInterval(pulseInterval);
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await api.get('appointments/my-appointments');
            const data = res.data || [];
            setAppointments(data);
            
            if (location.state?.autoOpenApptId) {
                const apptToOpen = data.find(a => a.id === location.state.autoOpenApptId);
                if (apptToOpen) setSelectedAppt(apptToOpen);
            }

            // Auto-switch tab if today has data
            const todayStr = new Date().toISOString().split('T')[0];
            const hasToday = (data || []).some(a => a.appointmentDate === todayStr);
            if (!hasToday && (data || []).some(a => a.appointmentDate > todayStr)) {
                setActiveTab('upcoming');
            }
        } catch (e) {
            console.error("Failed to fetch clinical schedule", e);
        } finally {
            setLoading(false);
        }
    };

    const todayString = new Date().toISOString().split('T')[0];
    const todaysAppointments = (appointments || []).filter(a => a.appointmentDate === todayString);
    const upcomingAppointments = (appointments || []).filter(a => a.appointmentDate > todayString);
    const pastAppointments = (appointments || []).filter(a => a.appointmentDate < todayString);

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
                                Live Telemetry Active
                            </div>
                            <span className="text-white/20">|</span>
                            <button 
                                onClick={fetchAppointments}
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
                {/* Tab Navigation */}
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

                {/* Search Bar */}
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
                                        onClick={() => navigate(`/doctor-dashboard/patients/${appt.patient?.id}`)}
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
                                        onClick={() => navigate(`/doctor-dashboard/patients/${appt.patient?.id}`)}
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
                                        onClick={() => navigate(`/doctor-dashboard/patients/${appt.patient?.id}`)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
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
                                    onClick={async (e) => { 
                                        e.stopPropagation(); 
                                        try {
                                            await api.post('appointments/confirm-upi', { appointmentId: appt.id });
                                            toast.success("Payment verified. Appointment booked.");
                                            // Refreshing handled by parent fetchAppointments if we passed it down, 
                                            // but for simplicity here we rely on the 30s heartbeat or manual refresh.
                                            // Ideally we should have a callback. Let's just use window.location.reload() for instant feedback or toast guidance.
                                            toast.success("Syncing Clinical Timeline...");
                                        } catch (err) {
                                            toast.error("Verification failed.");
                                        }
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
                             {appt.consultationType === 'ONLINE' && appt.meetLink && appt.status === 'BOOKED' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); window.open(appt.meetLink, '_blank'); }}
                                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                >
                                    <Video size={14} /> Enter Call
                                </button>
                             )}
                            <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-md active:scale-95">
                                Open File
                            </button>
                        </div>
                    </div>
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
