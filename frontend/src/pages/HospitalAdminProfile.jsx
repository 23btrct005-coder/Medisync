import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircle, Mail, Phone, Building2, ShieldCheck, 
  Edit3, Save, X, Activity, CheckCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosConfig';

const InfoRow = ({ icon: Icon, label, value, color = 'text-primary-500' }) => (
  <div className="flex items-start gap-3 py-4 border-b border-slate-100 last:border-0">
    <div className={`mt-0.5 shrink-0 ${color}`}><Icon size={18} /></div>
    <div className="flex-1 min-w-0 text-left">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-1">{value || <span className="text-slate-300 font-normal italic">Not provided</span>}</p>
    </div>
  </div>
);

const HospitalAdminProfile = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    adminPhone: '',
    email: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/hospital/profile');
        setProfile(res.data);
        setFormData({
          name: res.data.name || '',
          position: res.data.position || '',
          adminPhone: res.data.contactNumber || '',
          email: res.data.user?.email || ''
        });
      } catch (err) {
        console.error('Failed to fetch admin profile', err);
        toast.error('Identity node sync failed');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();
      // Prepare JSON data part - matching HospitalController expectations
      const data = {
        adminName: formData.name,
        position: formData.position,
        adminPhone: formData.adminPhone
      };
      formDataToSend.append('data', JSON.stringify(data));

      await api.post('/hospital/update-profile', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update local state
      setProfile({ 
        ...profile, 
        name: formData.name, 
        position: formData.position, 
        contactNumber: formData.adminPhone 
      });
      // Update global auth context if needed
      setUser({ ...user, name: formData.name, position: formData.position });
      
      setIsEditing(false);
      toast.success('Identity node updated successfully');
    } catch (err) {
      toast.error('Update synchronization failed');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="animate-spin text-primary-600"><Activity size={40} /></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Decrypting Identity Node...</p>
    </div>
  );

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD';
  const hospital = profile?.hospital;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="text-left">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Personal <span className="not-italic text-blue-600">Profile</span></h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Institutional Administrative Identity & Access Management</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl hover:border-blue-200 hover:text-blue-600 transition shadow-sm active:scale-95"
          >
            <Edit3 size={18} />
            Modify Identity
          </button>
        ) : (
          <div className="flex gap-3">
             <button 
                onClick={() => setIsEditing(false)}
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl hover:bg-slate-200 transition active:scale-95"
              >
                <X size={18} /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-blue-700 transition shadow-xl shadow-blue-200 active:scale-95"
              >
                <Save size={18} /> Sync Changes
              </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Identity Overview Card */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 translate-x-4 -translate-y-4 group-hover:rotate-0 transition-transform duration-1000">
                    <ShieldCheck size={160} className="text-blue-600" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-1 mb-6 shadow-2xl shadow-blue-200">
                        <div className="w-full h-full rounded-[1.25rem] bg-white flex items-center justify-center overflow-hidden">
                            {profile?.profilePictureUrl ? (
                                <img 
                                    src={profile.profilePictureUrl} 
                                    alt={profile?.name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            <div className={`${profile?.profilePictureUrl ? 'hidden' : 'block'} text-3xl font-black text-blue-600`}>
                                {initials}
                            </div>
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{profile?.name || 'Administrator'}</h3>
                    <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mt-2 bg-blue-50 px-3 py-1 rounded-full">{profile?.position || 'Chief Admin'}</p>
                    
                    <div className="w-full mt-8 pt-8 border-t border-slate-50 space-y-4">
                        <div className="flex items-center justify-between text-left p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Admin Node ID</p>
                                <p className="text-xs font-bold text-slate-700 mt-0.5">ADM-{String(profile?.id || '0').padStart(4, '0')}</p>
                            </div>
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Linked Institution Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Building2 size={20} className="text-primary-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-200">Linked Institution</h4>
                    </div>
                    <h4 className="text-lg font-black tracking-tight">{hospital?.name || 'Institutional Node'}</h4>
                    <p className="text-slate-400 text-xs mt-1">
                        {hospital?.city && hospital?.state 
                            ? `${hospital.city}, ${hospital.state}` 
                            : (hospital?.location || hospital?.city || 'Location Not Set')}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-primary-400 uppercase tracking-widest">
                        <ShieldCheck size={14} /> License: {hospital?.licenseCode || 'Pending'}
                    </div>
                </div>
            </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserCircle size={18} className="text-blue-600" />
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Identity Credentials</h4>
                    </div>
                    {isEditing && <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Edit Mode Active</span>}
                </div>
                
                <div className="p-10">
                    {!isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <InfoRow icon={UserCircle} label="Full Legal Name" value={profile?.name} />
                            <InfoRow icon={ShieldCheck} label="Designation / Role" value={profile?.position} color="text-indigo-500" />
                            <InfoRow icon={Mail} label="Primary Email" value={profile?.user?.email} color="text-blue-500" />
                            <InfoRow icon={Phone} label="Contact Number" value={profile?.contactNumber} color="text-emerald-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation / Role</label>
                                <input 
                                    type="text" 
                                    value={formData.position} 
                                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                                <input 
                                    type="tel" 
                                    value={formData.adminPhone} 
                                    onChange={(e) => setFormData({...formData, adminPhone: e.target.value})}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Email (Locked)</label>
                                <input 
                                    type="email" 
                                    disabled
                                    value={formData.email} 
                                    className="w-full bg-slate-100 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-slate-400 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50/50 rounded-[2.5rem] p-8 border border-blue-100/50 flex items-start gap-4 text-left">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600 shrink-0">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h5 className="text-sm font-black text-blue-900 uppercase tracking-tight">Security & Governance</h5>
                    <p className="text-xs text-blue-700/70 mt-1 leading-relaxed font-medium">
                        Your identity is linked to the **Institutional Root Node**. Any changes to your primary credentials will be logged in the system audit logs for compliance with digital health safety standards.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalAdminProfile;
