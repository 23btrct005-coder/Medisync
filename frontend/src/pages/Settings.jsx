import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, Bell, User, 
  Smartphone, Lock, 
  ChevronRight, CheckCircle2, AlertTriangle,
  Save, Loader2, Info, Mail, MessageSquare, Monitor
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Identity');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    mfaEnabled: false,
    emailNotifications: true,
    appNotifications: true,
    smsNotifications: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        mfaEnabled: !!user.mfaEnabled,
        emailNotifications: user.emailNotifications !== false,
        appNotifications: user.appNotifications !== false,
        smsNotifications: !!user.smsNotifications
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('patient/profile/sync', formData);
      await refreshUser();
      toast.success('Security infrastructure synchronized successfully.');
    } catch (e) {
      toast.error('Failed to apply security rules.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const tabs = [
    { name: 'Identity', icon: User },
    { name: 'Security', icon: Shield },
    { name: 'Alerts', icon: Bell },
    { name: 'Sync Keys', icon: Key },
  ];

  return (
    <div className="page-entry space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Vault Controls</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Security Infrastructure & Preferences</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="btn-premium bg-slate-900 text-white shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loading ? 'Synchronizing...' : 'Apply Security Rules'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                activeTab === tab.name 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 translate-x-1' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={20} className={activeTab === tab.name ? 'text-primary-300' : 'group-hover:text-primary'} />
                <span className="font-bold text-sm">{tab.name}</span>
              </div>
              <ChevronRight size={16} className={activeTab === tab.name ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </div>

        <div className="lg:col-span-9 space-y-8 min-h-[400px]">
          
          {activeTab === 'Identity' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="glass-panel p-8">
                   <div className="flex items-center gap-4 border-b border-slate-100 pb-8 mb-8">
                      <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                         <User size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900">Patient Identity</h3>
                         <p className="text-sm text-slate-500 font-medium">Update your core clinical metadata profile.</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Legal Name</label>
                         <input 
                            type="text" 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="input-premium py-4" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Email (Read-Only)</label>
                         <input type="email" defaultValue={user?.email} className="input-premium py-4 opacity-50 cursor-not-allowed" disabled />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Telemetry</label>
                         <input 
                            type="tel" 
                            value={formData.phone} 
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="input-premium py-4" 
                         />
                      </div>
                      <div className="space-y-2 flex flex-col justify-end">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2">Clinical Verification</p>
                         <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 italic font-bold text-xs">
                             <CheckCircle2 size={16} /> Verified Identity Source
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'Security' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-panel p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
                   <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <Lock size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900">Cryptographic Isolation</h3>
                      <p className="text-sm text-slate-500 font-medium">Manage how your medical telemetry is accessed across the network.</p>
                   </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white text-emerald-500 rounded-xl shadow-sm">
                         <Smartphone size={24} />
                      </div>
                      <div>
                         <p className="font-bold text-slate-800">Multi-Factor Authentication (MFA)</p>
                         <p className="text-xs text-slate-500 font-medium tracking-tight">Enable biometric/OTP verification for every login.</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleToggle('mfaEnabled')}
                     className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors duration-300 ${formData.mfaEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                   >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${formData.mfaEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                   </button>
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                   <AlertTriangle className="text-amber-600 shrink-0" size={24} />
                   <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      All clinical context is isolated using Row-Level Security. Enabling MFA adds an additional hardware-bound decryption layer to your patient record.
                   </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Alerts' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="glass-panel p-8 space-y-8">
                   <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
                      <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                         <Bell size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900">Notification Channels</h3>
                         <p className="text-sm text-slate-500 font-medium">Receive real-time synchronization updates from the clinic.</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      {[
                        { id: 'emailNotifications', label: 'Email Reports', desc: 'Detailed PDF clinical summaries sent to your inbox.', icon: Mail },
                        { id: 'appNotifications', label: 'In-App Telemetry', desc: 'Real-time dashboard notifications for vitals sync.', icon: Monitor },
                        { id: 'smsNotifications', label: 'Emergency SMS', desc: 'Urgent alerts for critical diagnostic results.', icon: MessageSquare },
                      ].map((pref) => (
                        <div key={pref.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><pref.icon size={18} /></div>
                              <div>
                                 <p className="text-sm font-bold text-slate-800">{pref.label}</p>
                                 <p className="text-[10px] text-slate-400 font-medium">{pref.desc}</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => handleToggle(pref.id)}
                             className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors duration-300 ${formData[pref.id] ? 'bg-primary-500' : 'bg-slate-200'}`}
                           >
                              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${formData[pref.id] ? 'translate-x-4' : 'translate-x-0'}`} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
            </div>
          )}

          {activeTab === 'Sync Keys' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="glass-panel p-8 space-y-8">
                   <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
                      <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                         <Key size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900">Access Framework</h3>
                         <p className="text-sm text-slate-500 font-medium">Manage unique clinical identifiers for doctor authorization.</p>
                      </div>
                   </div>

                   <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                      <Key className="absolute -right-10 -bottom-10 text-white/5 group-hover:scale-110 transition-transform duration-700" size={200} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2">Primary Patient UID</p>
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 font-mono text-xl tracking-tighter">
                          {user?.id ? `MS-PX-${user.id.toString().padStart(6, '0')}` : 'AUTH_RETRY_PENDING'}
                          <button onClick={() => { navigator.clipboard.writeText(`MS-PX-${user.id}`); toast.success('UID copied to clipboard'); }} className="ml-auto p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                             <Save size={14} />
                          </button>
                      </div>
                      <p className="text-[10px] text-white/40 mt-4 font-medium italic">Share this UID with clinicians to facilitate secure data bridging.</p>
                   </div>

                   <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                      <div className="flex items-start gap-4">
                         <Info className="text-slate-400 mt-1" size={20} />
                         <div>
                            <p className="text-sm font-bold text-slate-800">Rotation Protocol</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                               Rotating your sync keys will invalidate current emergency QR codes. New metadata must be generated after rotation.
                            </p>
                            <button 
                              onClick={() => toast.error('Advanced authority required for key rotation.')}
                              className="mt-4 px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition shadow-sm"
                            >
                               Initiate Rotation
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;s;
