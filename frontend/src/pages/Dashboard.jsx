import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import QRCode from 'react-qr-code';
import { 
  Activity, ClipboardList, UserCheck, Calendar, QrCode, X, 
  Download, Loader2, MessageSquare, ShieldCheck, Sparkles, 
  ChevronRight, Plus, Zap, Heart, Bell, Database, Globe,
  TrendingUp, ArrowUpRight, Lock
} from 'lucide-react';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import ActivityHub from '../components/ActivityHub';
import HealthSyncScore from '../components/HealthSyncScore';
import StatCardPro from '../components/StatCard'; 
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ClinicalAlertBanner from '../components/ClinicalAlertBanner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ recordsCount: 0, latestDiagnosis: 'None', doctor: 'None' });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patient, setPatient] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardInfo(),
        fetchRequests(),
        fetchLinkedDoctors(),
        fetchPatientData()
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

  const handleApproveRequest = async (id) => {
    try {
      await api.post(`patient/requests/${id}/accept`);
      toast.success('Clinical access granted.');
      fetchRequests();
    } catch (e) {
      toast.error('Failed to authorize access.');
    }
  };

  const emergencyUrl = `${window.location.origin}/emergency/${user?.id}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 selection:bg-emerald-100">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Pro Banner */}
        <ProfileCompletionBanner />

        {/* Hero Section: Unified OS Control Center */}
        <section className="relative overflow-hidden group">
          <div className="relative bg-[#0A1A1A] rounded-[3rem] p-10 md:p-14 text-white shadow-2xl overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
              <div className="space-y-6 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                  <ShieldCheck size={14} className="animate-pulse" />
                  Clinical Node Active
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                  Welcome, <span className="text-emerald-400">{(user?.name || 'User').split(' ')[0]}</span>
                </h1>
                
                <p className="text-slate-400 font-medium text-lg leading-relaxed">
                  Your "Unified Healthcare OS" is currently synchronizing 
                  <span className="text-white mx-1 font-bold">{stats.recordsCount} clinical archives</span> 
                  across your secure medical network.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => setShowQRModal(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#0A1A1A] rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                  >
                    <QrCode size={18} /> Emergency Key
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard/reports')}
                    className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                  >
                    <Plus size={18} /> New Report
                  </button>
                </div>
              </div>

              <div className="hidden lg:block">
                 <HealthSyncScore user={user} />
              </div>
            </div>
            
            {/* Background Graphic */}
            <Activity size={400} className="absolute -right-20 -bottom-20 text-emerald-500/5 rotate-12" />
          </div>
        </section>

        {/* Intelligence Feedback */}
        {!loading && patient && (
          <div className="animate-in slide-in-from-top-4 duration-700">
            <ClinicalAlertBanner patient={patient} />
          </div>
        )}

        {/* Stats Grid: Operating Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCardPro 
            title="Archives" 
            value={stats.recordsCount} 
            icon={Database} 
            color="emerald" 
            trend="+SYNC" 
            subtitle="Secure Documents"
          />
          <StatCardPro 
            title="Integrity" 
            value="ACTIVE" 
            icon={Lock} 
            color="blue" 
            trend="E2EE" 
            subtitle="Privacy Hardened"
          />
          <StatCardPro 
            title="Network" 
            value={doctors.length} 
            icon={Globe} 
            color="purple" 
            trend="VERIFIED" 
            subtitle="Clinical Links"
          />
          <StatCardPro 
            title="Diagnosis" 
            value={stats.latestDiagnosis} 
            icon={TrendingUp} 
            color="emerald" 
            trend="AI-V" 
            subtitle="Latest Status"
          />
        </div>

        {/* Data Architecture Hub */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          <div className="xl:col-span-8 space-y-8">
            {/* Access Requests */}
            {requests.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Bell size={24} /></div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase tracking-tighter">Access Requests</h2>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full animate-pulse uppercase tracking-widest">{requests.length} Pending</span>
                </div>
                
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-6 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-100 transition-all group/item">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-black text-emerald-500 shadow-sm overflow-hidden">
                          {req.doctor?.profilePictureUrl ? (
                            <img src={req.doctor.profilePictureUrl} className="w-full h-full object-cover" alt="Dr." />
                          ) : "Dr"}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">Dr. {req.doctor?.name || 'Physician'}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Medical License: Verified</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleApproveRequest(req.id)}
                        className="px-6 py-2.5 bg-[#0A1A1A] text-white text-[10px] font-black rounded-xl hover:bg-emerald-500 transition-all uppercase tracking-widest active:scale-95"
                      >
                        Authorize
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Action Hub */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl group hover:shadow-2xl transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-10" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Record Action</h3>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">Expand your clinical node by adding a new imaging report or health log.</p>
                <div className="flex gap-3">
                  <button onClick={() => navigate('/dashboard/reports')} className="flex-1 py-3 bg-[#0A1A1A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">Add Report</button>
                  <button onClick={() => navigate('/dashboard/booking')} className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all">Book Node</button>
                </div>
              </div>

              <div className="bg-[#0A1A1A] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                <Globe className="absolute -right-8 -bottom-8 text-white/5 group-hover:scale-110 transition-transform duration-1000" size={180} />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-500 text-white rounded-2xl"><UserCheck size={24} /></div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Security Node</h3>
                  </div>
                  <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">Your data is stored in the "Unified AI Context". RLS locks ensure total isolation from external nodes.</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                    <ShieldCheck size={12} /> Privacy Hardened
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-8">
            <ActivityHub />
          </div>
        </div>
      </div>

      {/* Emergency Modal */}
      {showQRModal && (
        <QRModal url={emergencyUrl} onClose={() => setShowQRModal(false)} />
      )}
    </div>
  );
};

/* --- SUBCOMPONENTS --- */

const QRModal = ({ url, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A1A1A]/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-[#0A1A1A] transition hover:bg-slate-100 rounded-full">
          <X size={24} />
        </button>

        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
            <QrCode size={40} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 leading-tight tracking-tighter uppercase mb-2">Emergency Key</h3>
          <p className="text-sm text-slate-500 mb-10 font-medium">Scan to unlock clinical telemetry.</p>

          <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 inline-block mb-10 relative group">
            <div className="absolute inset-0 bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-all" />
            <div className="relative">
              <QRCode 
                value={url}
                size={180}
                bgColor="#f8fafc"
                fgColor="#0a1a1a"
                level="H"
              />
            </div>
          </div>

          <button onClick={() => window.print()} className="w-full py-4 bg-[#0A1A1A] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">
             Print Emergency Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
