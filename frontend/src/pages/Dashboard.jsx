import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import QRCode from 'react-qr-code';
import { 
  Activity, ClipboardList, UserCheck, Calendar, QrCode, X, 
  Download, UserX, Loader2, Video, MapPin, Clock, 
  TrendingUp, ShieldCheck, Sparkles, ChevronRight, Plus,
  Zap, MessageSquare, Heart, Target, Bell
} from 'lucide-react';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import BookingModal from './BookingModal';
import ActivityHub from '../components/ActivityHub';
import HealthSyncScore from '../components/HealthSyncScore';
import StatCard from '../components/StatCard';
import SkeletonCard, { SkeletonRow } from '../components/SkeletonCard';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ recordsCount: 0, latestDiagnosis: 'None', doctor: 'None' });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      // We don't await the whole parallel block if we want skeletons to disappear as data arrives,
      // but for this simple version we keep parallel and then shut off loading.
      await Promise.all([
        fetchDashboardInfo(),
        fetchRequests(),
        fetchLinkedDoctors(),
        fetchAppointments()
      ]);
      setLoading(false);
    };
    
    initDashboard();
    const intervalId = setInterval(fetchRequests, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardInfo = async () => {
    try {
      const res = await api.get('records/my-records');
      const records = res.data;
      if(records && records.length > 0) {
          const latest = records.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
          setStats({
              recordsCount: records.length,
              latestDiagnosis: latest.diagnosis,
              doctor: latest.doctorName
          });
      }
    } catch (e) { console.error(e); }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('patient/requests');
      setRequests(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchLinkedDoctors = async () => {
    try {
      const res = await api.get('patient/doctors');
      setDoctors(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('appointments/my-appointments');
      setAppointments(res.data || []);
    } catch (e) { console.error(e); }
  };

  const emergencyUrl = `${window.location.origin}/emergency/${user?.id}`;

  return (
    <div className="page-entry space-y-10 pb-12">
      <ProfileCompletionBanner />

      {/* Super Hero Section */}
      <section className="relative group">
        <div className="absolute inset-0 bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-primary-200">
                <ShieldCheck size={14} className="text-emerald-300 animate-pulse" />
                Secure Clinical Identity
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Hello, <span className="text-primary-400">{user?.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-lg leading-relaxed">
                Your medical data is synchronizing across secure encrypted nodes.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={() => setShowQRModal(true)}
                  className="btn-premium bg-primary text-white border-none shadow-lg shadow-primary/30"
                >
                  <QrCode size={18} />
                  Emergency QR
                </button>
                <button className="btn-premium bg-white/10 text-white border-white/10 backdrop-blur-md hover:bg-white/20">
                  <MessageSquare size={18} />
                  AI Clinical Chat
                </button>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <HealthSyncScore user={user} />
            </div>
          </div>
          <Activity className="absolute -right-12 -bottom-12 text-white/5" size={300} />
        </div>
      </section>

      {/* Stats Ecosystem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[2rem] animate-pulse border border-slate-200" />)
        ) : (
          <>
            <StatCard 
              title="Clinical Archives" 
              value={stats.recordsCount} 
              icon={ClipboardList} 
              color="primary"
              trend="+Sync Active"
            />
            <StatCard 
              title="Lead Diagnosis" 
              value={stats.latestDiagnosis} 
              icon={TrendingUp} 
              color="emerald"
              trend="Verified AI"
            />
            <StatCard 
              title="Active Doctors" 
              value={doctors.length} 
              icon={UserCheck} 
              color="purple"
              trend="Certified"
            />
            <StatCard 
              title="System Integrity" 
              value="HARDENED" 
              icon={ShieldCheck} 
              color="indigo"
              trend="RLS Layer"
            />
          </>
        )}
      </div>

      {/* Content Hub */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Main Content Area (Col 1-8) */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Requests & Quick Actions */}
          {loading ? (
             <div className="glass-panel p-8 space-y-4">
                <SkeletonRow />
                <SkeletonRow />
             </div>
          ) : requests.length > 0 && (
            <div className="glass-panel p-6 border-l-4 border-amber-500 animate-in slide-in-from-left duration-500">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Bell size={20} /></div>
                  <h3 className="text-lg font-bold">Pending Access Requests</h3>
               </div>
               <div className="space-y-3">
                  {requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${req.doctorName}`} alt="" />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800">Dr. {req.doctorName}</p>
                             <p className="text-xs text-slate-500">Professional Access Authorization</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-600 transition">Approve</button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 space-y-4 border-l-4 border-primary group hover:bg-primary/5 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform"><UserCheck size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800">Direct Authorization</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">Instantly authorize a doctor via their registered email address.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Physician Email..." className="input-premium py-2 bg-white" />
                <button className="btn-premium py-2 px-4 whitespace-nowrap bg-primary text-white shadow-lg shadow-primary/20">Grant Access</button>
              </div>
            </div>

            <div className="glass-panel p-6 space-y-4 border-l-4 border-emerald-500 group hover:bg-emerald-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                  <h3 className="text-lg font-bold text-slate-800">New Health Log</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">Add a self-reported record or upcoming appointment details.</p>
                <div className="flex gap-2">
                   <button className="flex-1 btn-premium bg-slate-900 text-white hover:bg-slate-800 text-xs">Report Detail</button>
                   <button className="btn-premium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 text-xs">Book Clinic</button>
                </div>
            </div>
          </div>

          {/* Schedule Tracker */}
          <div className="glass-panel p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Calendar size={20} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Schedule Tracker</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Upcoming Syncs</p>
                </div>
              </div>
              <button className="text-xs font-black text-primary flex items-center gap-1 uppercase tracking-widest hover:translate-x-1 transition-transform">
                Full Calendar <ChevronRight size={14} />
              </button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <SkeletonCard />
                 <SkeletonCard />
              </div>
            ) : appointments.length === 0 ? (
              <EmptyState icon={<Calendar />} text="No upcoming consultations synchronized." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.slice(0, 4).map(appt => (
                  <AppointmentItem key={appt.id} appt={appt} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Activity Hub (Col 9-12) */}
        <div className="xl:col-span-4 space-y-8">
          <ActivityHub />
          
          {/* Security Deep-Dive */}
          <div className="glass-panel p-6 bg-slate-900 border-none text-white overflow-hidden relative group">
            <ShieldCheck className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform duration-700" size={140} />
            <div className="relative z-10">
              <h4 className="text-lg font-black tracking-tight mb-2">Private Context AI</h4>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Your medical data never leaves the encrypted context. RLS isolation ensures only authorized keys can unlock your telemetry.
              </p>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Security Hardened</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency QR Modal */}
      {showQRModal && (
        <QRModal url={emergencyUrl} onClose={() => setShowQRModal(false)} />
      )}
    </div>
  );
};

/* --- SUBCOMPONENTS --- */

const AppointmentItem = ({ appt }) => (
  <div className="glass-card p-4 flex gap-4 items-center group cursor-pointer hover:border-primary transition-all">
    <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex flex-col items-center justify-center font-bold group-hover:bg-primary group-hover:text-white transition-colors">
      <div className="text-xs">{appt.appointmentDate?.split('-')[2]}</div>
      <div className="text-[10px] uppercase opacity-60">{new Date(appt.appointmentDate).toLocaleString('en-US', { month: 'short' })}</div>
    </div>
    <div className="flex-1 min-w-0 text-left">
      <h4 className="text-sm font-bold text-slate-800 truncate">Dr. {appt.doctor?.name}</h4>
      <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
        <Clock size={10} /> {appt.timeSlot} • {appt.consultationType}
      </p>
    </div>
    <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:text-primary transition-colors border border-slate-100">
      <ChevronRight size={16} />
    </div>
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div className="text-center py-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
    <div className="text-slate-200 mb-2 flex justify-center">
      {React.cloneElement(icon, { size: 48 })}
    </div>
    <p className="text-slate-400 font-medium italic text-sm">{text}</p>
  </div>
);

const QRModal = ({ url, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-white rounded-[2.5rem] p-10 max-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300 ring-1 ring-black/5">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition hover:bg-slate-100 rounded-full">
        <X size={24} />
      </button>

      <div className="text-center">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 animate-pulse">
          <QrCode size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">Secure QR Key</h3>
        <p className="text-sm text-slate-500 mt-2 mb-8 font-medium">Unlock critical data in emergencies.</p>

        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 inline-block mb-8 relative">
          <QRCode 
            value={url}
            size={180}
            bgColor="#f8fafc"
            fgColor="#1e293b"
            level="H"
          />
        </div>

        <div className="flex flex-col gap-3">
          <button className="btn-premium bg-primary text-white w-full py-4 text-md shadow-lg shadow-primary/30 border-none">
            <Download size={20} /> Download Metadata
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
