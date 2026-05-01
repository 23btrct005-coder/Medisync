import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Stethoscope, Camera, Calendar, ShieldCheck, Sparkles, 
  Search, Bell, UserPlus, ChevronRight, Activity, Target,
  Zap, Globe, Database, ArrowUpRight, X, QrCode, AlertCircle, Star
} from 'lucide-react';
import api from '../api/axiosConfig';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import StatCardPro from '../components/StatCard';
import { SkeletonRow } from '../components/SkeletonCard';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patientEmail, setPatientEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [patientShortCode, setPatientShortCode] = useState('');
  const [passcode, setPasscode] = useState('');
  const [searching, setSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [scanError, setScanError] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
 
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchRequests();
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
      toast.success('Access signal requested.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const handleManualSearch = async () => {
    if (!patientShortCode) return;
    setSearching(true);
    try {
      // If passcode is provided, try direct unlock
      if (passcode) {
        await api.post('doctor/unlock-history', { patientId: patientShortCode.toUpperCase().trim(), passcode });
        toast.success('Clinical vault unlocked via passcode');
        const res = await api.get(`doctor/patient-by-code/${patientShortCode}`);
        if (res.data?.id) {
            navigate(`/doctor-dashboard/patients/${res.data.id}`);
        }
        setShowManualModal(false);
        return;
      }

      const res = await api.get(`doctor/patient-by-code/${patientShortCode}`);
      console.log("DEBUG: Search Result Payload", res.data);
      if (res.data?.id) {
        toast.success(`Patient ${res.data.name} located`);
        setShowManualModal(false);
        setTimeout(() => {
          if (res.data.isLinked) {
            navigate(`/doctor-dashboard/patients/${res.data.id}`);
          } else {
            // Authorized clinical node bypass: Redirect to Emergency Card for unlinked subjects
            navigate(`/emergency/${patientShortCode.toUpperCase().trim()}`);
          }
        }, 100);
      } else {
        toast.error('Patient not found');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search/Unlock failed');
    } finally {
      setSearching(false);
    }
  };

  const activePatients = (requests || []).filter(r => r.status === 'ACCEPTED').length;
  const pendingRequests = (requests || []).filter(r => r.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 selection:bg-emerald-100">
      <div className="max-w-7xl mx-auto space-y-8">
        <ProfileCompletionBanner />

        {/* Physician Power Unit */}
        <section className="relative overflow-hidden group">
          <div className="relative bg-[#0A1A1A] rounded-[3rem] p-10 md:p-14 text-white shadow-2xl overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
              <div className="space-y-6 max-w-2xl text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                  <Stethoscope size={14} className="animate-pulse" />
                  Verified Clinical Gateway
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                  Clinical Hub, <span className="text-emerald-400">Dr. {user?.name || 'Physician'}</span>
                </h1>
                
                <p className="text-slate-400 font-medium text-lg leading-relaxed">
                  Your "Unified Healthcare OS" gateway is active. Oversighting 
                  <span className="text-white mx-1 font-bold">{activePatients} verified nodes</span> 
                  with real-time decryption capabilities.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => setShowScanner(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#0A1A1A] rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                  >
                    <Camera size={18} /> Scan Patient QR
                  </button>
                  <button 
                    onClick={() => setShowManualModal(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 text-white"
                  >
                    <Zap size={18} /> Patient ID
                  </button>
                  <button 
                    onClick={() => navigate('/doctor-dashboard/patients')}
                    className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 text-white/70"
                  >
                    <Users size={18} /> Directory
                  </button>
                </div>
              </div>

              <div className="hidden lg:block relative">
                 <div className="w-48 h-48 rounded-[3rem] bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 backdrop-blur-3xl flex items-center justify-center relative group-hover:scale-105 transition-transform duration-700">
                    <Activity size={80} className="text-emerald-400 opacity-40 animate-pulse" />
                    <Database size={24} className="absolute top-4 right-4 text-emerald-500/50" />
                 </div>
              </div>
            </div>
            
            <Stethoscope size={400} className="absolute -right-20 -bottom-20 text-emerald-500/5 -rotate-12" />
          </div>
        </section>

        {/* Operating Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCardPro 
            title="Active Nodes" 
            value={activePatients} 
            icon={Globe} 
            color="emerald" 
            trend="OVERSIGHT" 
            subtitle="Verified Patients"
          />
          <StatCardPro 
            title="Access Stream" 
            value={pendingRequests} 
            icon={Zap} 
            color="amber" 
            trend="PENDING" 
            subtitle="Secure Signals"
          />
          <StatCardPro 
            title="Consultations" 
            value="Live" 
            icon={Calendar} 
            color="blue" 
            trend="ACTIVE" 
            subtitle="Consult Hub"
            onClick={() => navigate('/doctor-dashboard/appointments')}
          />
          <StatCardPro 
            title="Clinical Reputation" 
            value={`${user?.averageRating || '0.0'} ★`} 
            icon={Star} 
            color="indigo" 
            trend="SECURE" 
            subtitle={`${user?.ratingCount || 0} Patient Feedbacks`}
          />
        </div>

        {/* Clinical Control Architecture */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          <div className="xl:col-span-8 space-y-8">
            {/* Access Signal Requestor */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem] group-hover:scale-110 transition-transform shadow-sm">
                     <UserPlus size={24} />
                  </div>
                  <div className="text-left">
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Access Signal Requestor</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Broadcast a secure decryption request to a patient's email node.</p>
                  </div>
               </div>
               <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1 group/field">
                     <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-emerald-500 transition-colors" size={18} />
                     <input 
                        type="email" 
                        placeholder="patient_node@medisync.io" 
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all transition-all"
                     />
                  </div>
                  <button 
                     onClick={handleSendRequest}
                     disabled={sending}
                     className="px-10 py-4 bg-[#0A1A1A] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 border-none"
                  >
                     {sending ? 'Broadcasting...' : 'Request Access'}
                  </button>
               </div>
            </div>

            {/* Quick Actions Hub */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <button onClick={() => navigate('/doctor-dashboard/appointments')} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl group hover:shadow-2xl transition-all relative text-left overflow-hidden">
                  <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-6 inline-block group-hover:scale-110 transition-transform">
                     <Calendar size={28} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">Scheduler Node</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage Live Consultations</p>
               </button>
               <button onClick={() => navigate('/doctor-dashboard/patients')} className="bg-[#0A1A1A] rounded-[2.5rem] p-10 shadow-2xl group hover:shadow-emerald-500/10 transition-all relative text-left overflow-hidden">
                  <Globe className="absolute -right-8 -top-8 text-white/5 group-hover:rotate-12 transition-transform duration-700" size={120} />
                  <div className="p-4 bg-emerald-500 text-white rounded-2xl mb-6 inline-block group-hover:scale-110 transition-transform">
                     <Users size={28} />
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2">Patient Directory</h4>
                  <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest">Active Clinical Registry</p>
               </button>
            </div>
          </div>

          {/* Authorization Log Stream */}
          <div className="xl:col-span-4 h-full">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl h-full flex flex-col min-h-[500px]">
               <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Target size={22} className="animate-pulse" /></div>
                     <div className="text-left">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Authorization Stream</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Active Signals Only</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-4 flex-1">
                  {loading ? (
                     [1,2,3,4,5].map(i => <SkeletonRow key={i} />)
                  ) : requests.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                        <Zap size={48} className="text-slate-200 mb-4" />
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Scanning for incoming nodes...</p>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {requests.slice(0, 6).map(req => (
                           <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-emerald-50/50 border border-slate-100 rounded-2xl group transition-all">
                              <div className="min-w-0 text-left">
                                 <p className="text-xs font-black text-slate-800 truncate">Patient Identity Link</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{req.patient?.email || 'Secured Identifier'}</p>
                              </div>
                              <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] ${
                                req.status === 'ACCEPTED' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                                req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-red-500/10 text-red-600'
                              }`}>
                                {req.status}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
               
               <div className="mt-8 pt-6 border-t border-slate-50">
                  <div className="flex items-center justify-between gap-3 p-4 bg-[#0A1A1A] rounded-[2rem]">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Node Secure</span>
                     </div>
                     <ArrowUpRight size={14} className="text-white/20" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optical Link Scanner */}
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0A1A1A]/95 backdrop-blur-2xl"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative border border-white/5"
             >
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-pulse">
                      <QrCode size={28} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-2xl font-black text-[#0A1A1A] tracking-tighter uppercase leading-none">Node Scanner</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Initialize Optical Sync</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowScanner(false)}
                    className="p-3 text-slate-400 hover:text-black transition hover:bg-slate-50 rounded-full"
                  >
                    <X size={24} />
                  </button>
                </div>

                {scanError ? (
                  <div className="bg-red-50/50 border border-red-100 rounded-[2.5rem] p-12 text-center">
                     <AlertCircle className="text-red-500 mx-auto mb-6" size={56} />
                     <p className="text-red-900 font-black uppercase tracking-[0.2em] text-xs">{scanError}</p>
                     <button 
                      onClick={() => setShowScanner(false)}
                      className="mt-8 px-10 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95"
                     >
                      Abort Initialization
                     </button>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div id="qr-reader" className="overflow-hidden rounded-[2.5rem] border-[10px] border-slate-50 bg-[#0A1A1A] aspect-square shadow-2xl relative shadow-inner">
                        <div className="absolute inset-x-8 top-1/2 h-0.5 bg-emerald-500/50 animate-scan z-10" />
                    </div>
                    <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                      Aligning with remote telemetry node...
                    </p>
                  </div>
                )}
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual ID Modal */}
      <AnimatePresence>
        {showManualModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0A1A1A]/95 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl relative border border-white/5"
            >
              <button onClick={() => setShowManualModal(false)} className="absolute top-8 right-8 p-3 text-slate-400 hover:text-black transition hover:bg-slate-50 rounded-full">
                <X size={24} />
              </button>

              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                  <Zap size={40} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 leading-tight tracking-tighter uppercase mb-2">Manual Lookup</h3>
                <p className="text-sm text-slate-500 mb-10 font-medium uppercase tracking-widest text-[10px]">Enter Patient Short Code</p>

                <div className="space-y-4 mb-10">
                  <div className="relative group/field">
                    <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within/field:text-emerald-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Patient ID (e.g. TN-29-0008)" 
                      autoFocus
                      value={patientShortCode}
                      onChange={(e) => setPatientShortCode(e.target.value)}
                      className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-[2rem] pl-16 pr-6 py-4 text-sm font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-emerald-900 placeholder:text-emerald-900/40"
                    />
                  </div>

                  <div className="relative group/field">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500/40 group-focus-within/field:text-blue-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Passcode (Optional)" 
                      maxLength={6}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-[2rem] pl-16 pr-6 py-4 text-sm font-black tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-blue-900 placeholder:text-blue-900/40"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase text-center px-4 leading-relaxed">
                    Provide the 6-digit passcode for **direct access** to full history.
                  </p>
                </div>

                <button 
                  onClick={handleManualSearch}
                  disabled={searching || !patientShortCode}
                  className="w-full py-5 bg-[#0A1A1A] text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
                >
                  {searching ? 'Linking Node...' : 'AUTHORIZE CLINICAL ACCESS'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;
