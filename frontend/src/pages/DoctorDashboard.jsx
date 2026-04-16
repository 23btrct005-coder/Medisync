import { useState, useEffect, React } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, FileStack, Stethoscope, AlertCircle, QrCode, X, 
  Camera, Calendar, Clock, ShieldCheck, TrendingUp, Sparkles, 
  Search, Bell, UserPlus, ChevronRight, Activity, Target
} from 'lucide-react';
import api from '../api/axiosConfig';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import StatCard from '../components/StatCard';
import SkeletonCard, { SkeletonRow } from '../components/SkeletonCard';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patientEmail, setPatientEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState('');
  const [requests, setRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
 
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchRequests(), fetchAppointments()]);
      setLoading(false);
    };
    fetchData();
  }, []);
 
  const fetchRequests = async () => {
    try {
      const res = await api.get('doctor/requests');
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch doctor requests", err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('appointments/my-appointments'); 
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch doctor appointments", err);
    }
  };

  useEffect(() => {
    let html5QrCode = null;
    if (showScanner) {
      const timer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode("qr-reader");
          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              const patientId = decodedText.split('/').pop();
              if (patientId && !isNaN(patientId)) {
                html5QrCode.stop().then(() => {
                   setShowScanner(false);
                   navigate(`/emergency/${patientId}`);
                });
              }
            },
            () => {}
          ).catch(err => {
            setScanError("Unable to access camera nodes.");
          });
        } catch (e) {
          console.error("Scanner setup error:", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (html5QrCode?.isScanning) {
          html5QrCode.stop().catch(e => console.warn(e));
        }
      };
    }
  }, [showScanner, navigate]);

  const handleSendRequest = async () => {
    if(!patientEmail) return;
    setSending(true);
    try {
      await api.post('doctor/request-access', { patientEmail });
      setPatientEmail('');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-entry space-y-10 pb-12">
      <ProfileCompletionBanner />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-emerald-400">
              <ShieldCheck size={14} className="animate-pulse" />
              Verified Clinical Professional
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Clinical Hub, <span className="text-primary-400">Dr. {user?.name?.split(' ').pop()}</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-lg leading-relaxed">
              Your physician gateway is active. Oversighting secure patient telemetry nodes.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => setShowScanner(true)}
                className="btn-premium bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/30"
              >
                <Camera size={18} />
                Scan Patient QR
              </button>
              <button onClick={() => navigate('/doctor-dashboard/patients')} className="btn-premium bg-white/10 text-white border-white/10 backdrop-blur-md hover:bg-white/20">
                <Users size={18} />
                Directory
              </button>
            </div>
          </div>
          
          <div className="hidden lg:block relative">
             <div className="w-48 h-48 rounded-[2rem] bg-gradient-to-br from-primary/20 to-indigo-500/20 border border-white/10 backdrop-blur-3xl flex items-center justify-center animate-pulse-soft">
                <Stethoscope size={80} className="text-primary-300 opacity-40" />
             </div>
          </div>
        </div>
        <Activity className="absolute -left-12 -bottom-12 text-white/5" size={300} />
      </section>

      {/* Intelligence Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[2rem] animate-pulse border border-slate-100" />)
        ) : (
          <>
            <StatCard 
              title="Active Patients" 
              value={requests.filter(r => r.status === 'ACCEPTED').length} 
              icon={Users} 
              color="primary"
              trend="Live Oversight"
            />
            <StatCard 
              title="Daily Consults" 
              value={appointments.length} 
              icon={Calendar} 
              color="emerald"
              trend="Scheduled"
            />
            <StatCard 
              title="Intelligence Alerts" 
              value="2" 
              icon={Sparkles} 
              color="purple"
              trend="AI Detected"
            />
            <StatCard 
              title="Node Status" 
              value="SYNCED" 
              icon={ShieldCheck} 
              color="indigo"
              trend="HIPAA Sync"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Section (Access Management) */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Quick Access Grant */}
          <div className="glass-panel p-8 border-l-4 border-primary group">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                   <UserPlus size={24} />
                </div>
                <div className="text-left">
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Expand Clinical Oversight</h3>
                   <p className="text-xs text-slate-500 font-medium">Request secure record access via patient telemetry identifier.</p>
                </div>
             </div>
             <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                      type="email" 
                      placeholder="Enter Patient Email Identifier..." 
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="input-premium pl-12 py-4 bg-slate-50/50"
                   />
                </div>
                <button 
                   onClick={handleSendRequest}
                   disabled={sending}
                   className="btn-premium bg-slate-900 text-white px-8 py-4 shadow-xl hover:bg-black disabled:opacity-50 border-none"
                >
                   {sending ? 'Initiating Sync...' : 'Request Access Signal'}
                </button>
             </div>
          </div>

          {/* Appointment Tracker */}
          <div className="glass-panel p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Calendar size={20} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Engagement Schedule</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Clinical Syncs</p>
                </div>
              </div>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Full Outlook &rarr;</button>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <SkeletonCard />
                 <SkeletonCard />
              </div>
            ) : appointments.length === 0 ? (
              <EmptyState icon={<Calendar />} text="The consultation queue is currently empty." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map(appt => (
                  <div key={appt.id} className="glass-card p-4 flex gap-4 items-center group cursor-pointer hover:border-primary transition-all">
                    <div className="w-12 h-12 bg-primary text-white rounded-2xl flex flex-col items-center justify-center font-bold shadow-lg shadow-primary/20">
                      <div className="text-xs">{appt.appointmentDate?.split('-')[2]}</div>
                      <div className="text-[9px] uppercase opacity-70">{new Date(appt.appointmentDate).toLocaleString('en-US', { month: 'short' })}</div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-sm font-extrabold text-slate-800 truncate">{appt.patient?.name}</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold italic uppercase tracking-tighter">
                        <Clock size={10} /> {appt.timeSlot} • {appt.consultationType}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section (Access Logs) */}
        <div className="xl:col-span-4 space-y-8">
           <div className="glass-panel p-6 h-full flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                       <Target size={22} className="animate-pulse" />
                    </div>
                    <div className="text-left">
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">Access Signals</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Authorization Stream</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 {loading ? (
                    [1,2,3,4].map(i => <SkeletonRow key={i} />)
                 ) : requests.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                       <AlertCircle size={40} className="text-slate-200 mb-4" />
                       <p className="text-xs text-slate-400 font-medium italic">No active access signals.</p>
                    </div>
                 ) : (
                    requests.map(req => (
                       <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-primary transition-colors">
                          <div className="min-w-0 text-left">
                             <p className="text-sm font-black text-slate-800 truncate">Patient Identity</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{req.patient?.email || 'Authorized Link'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                            req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {req.status}
                          </span>
                       </div>
                    ))
                 )}
              </div>
              
              <div className="mt-auto pt-6 border-t border-slate-100">
                 <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-2xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Security Gate Active</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-300 border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <QrCode size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Signal Scanner</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Optical Telemetry Link</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowScanner(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 transition hover:bg-slate-50 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              {scanError ? (
                <div className="bg-red-50 border border-red-100 rounded-[2rem] p-10 text-center">
                   <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                   <p className="text-red-800 font-black uppercase tracking-widest text-xs">{scanError}</p>
                   <button 
                    onClick={() => setShowScanner(false)}
                    className="mt-6 px-8 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest"
                   >
                    Emergency Abort
                   </button>
                </div>
              ) : (
                <>
                  <div id="qr-reader" className="overflow-hidden rounded-[2rem] border-[6px] border-slate-50 bg-slate-900 aspect-square shadow-inner"></div>
                  <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Stabilizing optical link... Align QR.
                  </p>
                </>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ icon, text }) => (
  <div className="text-center py-16 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
    <div className="text-slate-200 mb-4 flex justify-center">
      {React?.cloneElement ? React.cloneElement(icon, { size: 64 }) : null}
    </div>
    <p className="text-slate-400 font-extrabold uppercase tracking-widest text-[10px] px-8 leading-relaxed max-w-xs mx-auto">{text}</p>
  </div>
);

export default DoctorDashboard;
