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
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Patient <span className="text-primary italic">Dashboard</span>
              </h1>
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] ml-1">Clinical Wellness Intelligence Node</p>
          </div>
          <div className="flex items-center gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm pr-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Zap size={20} />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wellness Score</p>
                      <p className="text-sm font-black text-slate-900 uppercase">94.2 • OPTIMAL</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Quick Services Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
              <button 
                  key={service.name}
                  onClick={() => navigate(service.path)}
                  className="glass-card p-6 group flex items-center gap-4 text-left hover:scale-[1.02] transition-all"
              >
                  <div className={`p-4 rounded-2xl ${service.bg} ${service.color} transition-transform group-hover:scale-110 duration-500`}>
                      <service.icon size={24} />
                  </div>
                  <div>
                      <h4 className="font-black text-slate-900 tracking-tight text-sm uppercase">{service.name}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Node</span>
                      </div>
                  </div>
              </button>
          ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-8 space-y-8">
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
                      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                              <div className="flex items-center gap-8">
                                  <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                      <Calendar size={28} className="text-primary" />
                                  </div>
                                  <div>
                                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Upcoming Consultation</p>
                                      <h3 className="text-2xl font-black tracking-tighter mb-2">{upcoming.serviceName || `Dr. ${upcoming.doctor?.name}`}</h3>
                                      <div className="flex items-center gap-4 text-white/50 text-[10px] font-black uppercase tracking-wider">
                                          <span className="flex items-center gap-1.5"><Clock size={14}/> {upcoming.appointmentDate} • {upcoming.timeSlot}</span>
                                          <div className="w-1 h-1 bg-white/20 rounded-full" />
                                          <span className="text-emerald-400">{upcoming.consultationType}</span>
                                      </div>
                                  </div>
                              </div>
                              <button onClick={() => navigate('/dashboard/appointments')} className="px-8 py-3.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 transition-all">
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
              <div className="glass-panel p-8 space-y-6">
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
                          <button key={hub.name} onClick={() => navigate(hub.path)} className="p-5 rounded-2xl border border-slate-50 hover:border-primary/20 hover:bg-slate-50 transition-all group flex flex-col items-center gap-3 text-center">
                              <div className={`p-3 rounded-xl ${hub.bg} ${hub.color} transition-transform group-hover:scale-110`}><hub.icon size={20}/></div>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{hub.name}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      </div>
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
