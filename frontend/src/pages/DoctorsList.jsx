import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCheck, Shield, Revoke, Trash2, Mail, Plus, 
  ChevronRight, Activity, Clock, ShieldX, UserMinus, MessageSquare 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api/axiosConfig';
import ClinicalChatBox from '../components/ClinicalChatBox';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('patient/doctors');
      setDoctors(res.data || []);
    } catch (e) {
      toast.error("Failed to sync care team");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (doctorId) => {
    if (!window.confirm("CAUTION: This will immediately revoke clinical data access for this physician. Continue?")) return;
    
    try {
      await api.delete(`patient/doctors/${doctorId}`);
      toast.success("Clinical access revoked successfully");
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
    } catch (e) {
      toast.error("Failed to revoke access. Security policy restricted.");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsInviting(true);
    try {
      await api.post('patient/link-doctor', { doctorEmail: inviteEmail });
      toast.success("Clinical bridge request sent!");
      setInviteEmail('');
      setShowInvite(false);
      fetchDoctors(); // Refresh list if they were already in system
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to establish bridge");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Care Team</h1>
          <p className="text-slate-500 font-medium mt-1">Manage physician access and data-sharing permissions.</p>
        </div>
        <button 
          onClick={() => setShowInvite(true)}
          className="btn-premium bg-primary text-white shadow-xl shadow-primary/20 px-8 py-4 flex items-center gap-2 border-none hover:scale-105"
        >
          <Plus size={20} /> Grant Access
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main List */}
        <div className="xl:col-span-8 space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => <SkeletonLoader key={i} />)
          ) : doctors.length === 0 ? (
            <EmptyState />
          ) : (
            <AnimatePresence>
              {doctors.map((doctor) => (
                <DoctorCard 
                  key={doctor.id} 
                  doctor={doctor} 
                  onRevoke={() => handleRevoke(doctor.id)} 
                  setActiveChat={setActiveChat}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Info / Policy Side-panel */}
        <div className="xl:col-span-4 space-y-6">
          <div className="glass-panel p-6 bg-slate-900 text-white border-none relative overflow-hidden group">
            <Shield className="absolute -right-8 -bottom-8 text-white/5 group-hover:scale-110 transition-transform duration-700" size={160} />
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <UserCheck size={20} className="text-primary-400" /> Data Sovereignty
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                You maintain absolute control. Revoking a physician's access immediately severs the encrypted RLS bridge, 
                making your telemetry unavailable to their portal.
              </p>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                 <Clock size={18} className="text-primary-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Real-time Revocation Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative"
          >
            <h3 className="text-2xl font-black text-slate-900 mb-2">Bridge New Physician</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium">Verify via official MediSync email to grant clinical context access.</p>
            
            <form onSubmit={handleInvite} className="space-y-4">
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Doctor Email Address</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="physician@hospital.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white outline-none transition-all font-medium"
                      required
                    />
                 </div>
               </div>
               <div className="flex gap-3 pt-4">
                 <button 
                   type="button" 
                   onClick={() => setShowInvite(false)}
                   className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   disabled={isInviting}
                   className="flex-2 btn-premium bg-primary text-white px-8 border-none shadow-lg shadow-primary/20"
                 >
                   {isInviting ? "Establishing..." : "Connect Doctor"}
                 </button>
               </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Chat Box */}
      {activeChat && (
        <ClinicalChatBox 
          receiverId={activeChat.userId} 
          receiverName={activeChat.name} 
          onClose={() => setActiveChat(null)} 
        />
      )}
    </div>
  );
};

/* --- SUBCOMPONENTS --- */

const DoctorCard = ({ doctor, onRevoke, setActiveChat }) => (
  <motion.div 
    layout
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 20, opacity: 0 }}
    className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-primary-200 transition-all shadow-sm"
  >
    <div className="flex items-center gap-5">
      <div className="relative">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-inner flex items-center justify-center text-slate-400">
           {doctor.profilePictureUrl ? (
             <img src={doctor.profilePictureUrl} className="w-full h-full object-cover" alt={doctor.name} />
           ) : <Activity size={32} />}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Dr. {doctor.name}</h3>
        <p className="text-xs text-slate-500 font-medium">{doctor.specialization || "Clinical Associate"}</p>
        <div className="flex items-center gap-4 mt-2">
           <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
             <Shield size={10} /> Active Bridge
           </div>
           <span className="text-[10px] text-slate-400 font-medium">Verified Physician</span>
        </div>
      </div>
    </div>
    
    <div className="flex gap-2">
      <button 
        onClick={() => setActiveChat({ id: doctor.id, name: doctor.name, userId: doctor.user?.id })}
        className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition-all shadow-sm"
      >
        <MessageSquare size={16} /> Secure Message
      </button>
      <button 
        onClick={onRevoke}
        className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-600 hover:text-white transition-all shadow-sm"
      >
        <UserMinus size={16} /> Revoke Permissions
      </button>
    </div>
  </motion.div>
);

const SkeletonLoader = () => (
  <div className="h-28 bg-slate-50 rounded-3xl border border-slate-100 animate-pulse flex items-center px-6 gap-6">
    <div className="w-16 h-16 bg-slate-200 rounded-2xl" />
    <div className="flex-1 space-y-3">
       <div className="h-4 bg-slate-200 w-1/3 rounded-full" />
       <div className="h-2 bg-slate-200 w-1/4 rounded-full" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-sm">
      <UserCheck size={40} />
    </div>
    <h3 className="text-xl font-bold text-slate-800">No Clinical Delegates</h3>
    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto font-medium">You haven't authorized any physicians to access your medical stream yet.</p>
  </div>
);

export default DoctorsList;
