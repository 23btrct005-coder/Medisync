import React, { useState } from 'react';
import { 
  Shield, Key, Bell, CreditCard, User, 
  Smartphone, Globe, HardDrive, Lock, 
  ChevronRight, ArrowLeft, CheckCircle2, AlertTriangle,
  Zap, Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Security');
  const [saved, setSaved] = useState(false);

  const tabs = [
    { name: 'Identity', icon: User },
    { name: 'Security', icon: Shield },
    { name: 'Sync Keys', icon: Key },
    { name: 'Alerts', icon: Bell },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-entry space-y-10 pb-12">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Vault Controls</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Security Infrastructure & Preferences</p>
        </div>
        <button 
          onClick={handleSave}
          className={`btn-premium ${saved ? 'bg-emerald-500 border-none' : 'bg-slate-900'} text-white shadow-xl flex items-center gap-2 transition-all`}
        >
          {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {saved ? 'Changes Stabilized' : 'Apply Security Rules'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Navigation Sidebar */}
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

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8">
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

                {/* 2FA Toggle */}
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white text-emerald-500 rounded-xl shadow-sm">
                         <Smartphone size={24} />
                      </div>
                      <div>
                         <p className="font-bold text-slate-800">Multi-Factor Authentication (MFA)</p>
                         <p className="text-xs text-slate-500 font-medium tracking-tight">Hardware keys or biometric sync for every login.</p>
                      </div>
                   </div>
                   <div className="w-14 h-8 bg-emerald-500 rounded-full flex items-center px-1 cursor-pointer">
                      <div className="w-6 h-6 bg-white rounded-full shadow-md translate-x-6" />
                   </div>
                </div>

                {/* Security Logs */}
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Pulse</h4>
                   {[
                     { event: 'Global Login Attempt', location: 'New York, US', time: '2h ago', status: 'Success' },
                     { event: 'RLS Key Rotation', location: 'System Origin', time: '14h ago', status: 'Success' },
                   ].map((log, i) => (
                     <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                        <div className="flex gap-4">
                           <div className="w-1.5 h-1.5 mt-1.5 bg-emerald-500 rounded-full" />
                           <div>
                              <p className="text-sm font-bold text-slate-800">{log.event}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{log.location} • {log.time}</p>
                           </div>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">{log.status}</span>
                     </div>
                   ))}
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                   <AlertTriangle className="text-amber-600 shrink-0" size={24} />
                   <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      Rotating your encryption keys will temporarily suspend all active doctor dashboard syncs. Ensure you coordinate with your regular physicians before proceeding.
                   </p>
                </div>
              </div>
            </div>
          )}

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
                         <input type="text" defaultValue={user?.name} className="input-premium py-4" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Email</label>
                         <input type="email" defaultValue={user?.email} className="input-premium py-4 opacity-50 cursor-not-allowed" disabled />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Telemetry</label>
                         <input type="tel" defaultValue={user?.phone || '+1 (555) 012-3456'} className="input-premium py-4" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Language Node</label>
                         <select className="input-premium py-4">
                            <option>English (Clinical Standard)</option>
                            <option>Spanish</option>
                            <option>French</option>
                         </select>
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

export default Settings;
