import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { 
  Activity, ClipboardList, UserCheck, Calendar, QrCode, X, 
  MessageSquare, ShieldCheck, Sparkles, 
  ChevronRight, Plus, Zap, Heart, Bell, Globe,
  TrendingUp, LayoutGrid, FileText, Pill, Wallet, Clock,
  Truck, Thermometer, Droplets, MapPin, Search, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ recordsCount: 0, latestDiagnosis: 'None', doctor: 'None' });
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardInfo(),
        fetchPatientData(),
        fetchAppointments(),
        fetchLatestVitals()
      ]);
      setLoading(false);
    };
    initDashboard();
  }, []);

  const fetchPatientData = async () => {
    try {
        const res = await api.get('patient/profile');
        setPatient(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchDashboardInfo = async () => {
    try {
      const res = await api.get('records/my-records');
      const records = res.data;
      if(records && records.length > 0) {
          const latest = [...records].sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
          setStats({
              recordsCount: records.length,
              latestDiagnosis: latest.diagnosis,
              doctor: latest.doctorName
          });
      }
    } catch (e) { console.error(e); }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/my-appointments');
      setAppointments(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchLatestVitals = async () => {
    try {
      const res = await api.get('/patient/vitals');
      if (res.data && res.data.length > 0) {
        setVitals(res.data[res.data.length - 1]);
      }
    } catch (e) { console.error(e); }
  };

  const services = [
    { name: 'Emergency Care', icon: HeartPulse, color: 'text-red-500', bg: 'bg-red-50', path: '/dashboard/booking?service=Emergency' },
    { name: 'Ambulance Booking', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50', path: '/dashboard/booking?service=Ambulance' },
    { name: 'Oxygen Support', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50', path: '/dashboard/booking?service=Oxygen' },
    { name: 'Casualty Dept', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50', path: '/dashboard/booking?service=Casualty' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] selection:bg-blue-100 pb-20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-[40] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <Search size={18} />
            </div>
            <div className="hidden md:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Node</p>
                <p className="text-sm font-bold text-slate-900">MediSync Central Command</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="w-px h-6 bg-slate-100 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user?.name || 'User'}</p>
                    <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Node Verified</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                    <UserCheck size={20} className="text-slate-400" />
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-10 space-y-12">
        {/* Emergency Alert Section */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="emergency-glow emergency-pulse rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-red-500 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-red-200">
                <AlertCircle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-1">Emergency Protocol Active</h2>
                <p className="text-sm text-slate-500 font-medium max-w-md">Immediate clinical intervention available. Launch ambulance dispatch or contact casualty department.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button onClick={() => navigate('/dashboard/booking?service=Ambulance')} className="px-8 py-3.5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                <Truck size={16} /> Book Ambulance
              </button>
              <button className="px-8 py-3.5 bg-white border border-red-200 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                <Phone size={16} /> Contact Casualty
              </button>
            </div>
          </div>
        </section>

        {/* Hero: Medical Services Grid */}
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Services</h3>
                <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">View All Hubs <ChevronRight size={14}/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {services.map((service) => (
                    <button 
                        key={service.name}
                        onClick={() => navigate(service.path)}
                        className="glass-card p-8 group flex flex-col items-start gap-4 text-left"
                    >
                        <div className={`p-4 rounded-2xl ${service.bg} ${service.color} transition-transform group-hover:scale-110 duration-500`}>
                            <service.icon size={28} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 tracking-tight text-lg mb-1">{service.name}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">24/7 Priority Access</p>
                        </div>
                        <div className="w-full h-px bg-slate-50 mt-2"></div>
                        <div className="flex items-center justify-between w-full pt-2">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Node</span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                    </button>
                ))}
            </div>
        </section>

        {/* Center Panel: Clinical Vitals & Intelligence */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-10">
                {/* Vitals Summary */}
                <section className="glass-panel p-8 md:p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Clinical Telemetry</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Real-time vitals synchronization</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                            <Activity size={12} className="animate-pulse" /> Live Monitoring
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <VitalCard title="Heart Rate" value={vitals?.hr || "—"} unit="BPM" icon={Heart} color="text-rose-500" bg="bg-rose-50" />
                        <VitalCard title="Blood Pressure" value={vitals?.bloodPressure || "—"} unit="mmHg" icon={Droplets} color="text-blue-500" bg="bg-blue-50" />
                        <VitalCard title="SpO2 Level" value={vitals?.spo2 ? `${vitals.spo2}%` : "—"} unit="Oxygen" icon={Zap} color="text-primary" bg="bg-primary/5" />
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Last Sync: {vitals ? 'Just Now' : 'Pending'}</p>
                        <button onClick={fetchLatestVitals} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:underline">
                            <RotateCcw size={14} /> Force Re-sync
                        </button>
                    </div>
                </section>

                {/* Upcoming Consultation */}
                {(() => {
                    const upcoming = appointments
                        .filter(a => a.status === 'BOOKED' && new Date(a.appointmentDate) >= new Date().setHours(0,0,0,0))
                        .sort((a,b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];
                    if (!upcoming) return null;

                    return (
                        <div className="bg-[#0A1A1A] rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-8">
                                    <div className="w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center">
                                        <Calendar size={32} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Upcoming Consultation</p>
                                        <h3 className="text-3xl font-black tracking-tighter mb-2">{upcoming.serviceName || `Dr. ${upcoming.doctor?.name}`}</h3>
                                        <div className="flex items-center gap-4 text-white/50 text-xs font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5"><Clock size={14}/> {upcoming.appointmentDate} • {upcoming.timeSlot}</span>
                                            <div className="w-1 h-1 bg-white/20 rounded-full" />
                                            <span className="text-emerald-400">{upcoming.consultationType}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/dashboard/appointments')} className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                                    Launch Protocol
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Right Panel: AI & Hubs */}
            <div className="xl:col-span-4 space-y-8">
                {/* AI Reports Summary */}
                <div className="glass-panel p-8 space-y-6 border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 tracking-tight text-lg">AI Reports</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Neural diagnostic summary</p>
                        </div>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Latest Diagnosis</p>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed">{stats.latestDiagnosis}</p>
                    </div>
                    <button onClick={() => navigate('/dashboard/reports')} className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                        Open Clinical Briefs <ChevronRight size={14}/>
                    </button>
                </div>

                {/* Health Hub Widget */}
                <div className="glass-panel p-8 space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Hub</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { name: 'Records', icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', path: '/dashboard/history' },
                            { name: 'Medications', icon: Pill, color: 'text-amber-600', bg: 'bg-amber-50', path: '/dashboard/medications' },
                            { name: 'Health Wallet', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/dashboard/wallet' },
                            { name: 'Security', icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-50', path: '/dashboard/security' },
                        ].map(hub => (
                            <button key={hub.name} onClick={() => navigate(hub.path)} className="p-5 rounded-2xl border border-slate-50 hover:border-primary/20 hover:bg-slate-50 transition-all group flex flex-col items-center gap-3">
                                <div className={`p-3 rounded-xl ${hub.bg} ${hub.color} transition-transform group-hover:scale-110`}><hub.icon size={20}/></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{hub.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

const VitalCard = ({ title, value, unit, icon: Icon, color, bg }) => (
  <div className="p-6 rounded-3xl bg-white border border-slate-100 flex items-center gap-5 transition-all hover:shadow-xl hover:shadow-slate-100/50">
    <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0`}>
        <Icon size={24} />
    </div>
    <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-1.5 overflow-hidden">
            <span className="text-xl font-black text-slate-900 truncate">{value}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{unit}</span>
        </div>
    </div>
  </div>
);

const HeartPulse = ({ size, className }) => (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <Heart size={size} className="relative z-10" />
        <div className="absolute inset-0 bg-red-500/20 blur-xl animate-pulse"></div>
    </div>
);

const AlertCircle = ({ size }) => (
    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
        <ShieldCheck size={size} />
    </motion.div>
);

const RotateCcw = ({ size }) => <Clock size={size} className="animate-spin [animation-duration:8s]"/>;

export default Dashboard;
