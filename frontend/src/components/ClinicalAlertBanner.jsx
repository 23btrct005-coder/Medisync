import React from 'react';
import { AlertCircle, AlertTriangle, Droplets, ShieldAlert, Activity } from 'lucide-react';

const ClinicalAlertBanner = ({ patient }) => {
  if (!patient) return null;

  const alerts = [
    {
      id: 'blood',
      label: 'Blood Group',
      value: patient.bloodGroup || 'Not Specified',
      icon: <Droplets className="text-rose-500" size={16} />,
      color: 'bg-rose-50 border-rose-100 text-rose-700'
    },
    {
      id: 'allergies',
      label: 'Allergies',
      value: patient.allergies || 'No Known Allergies',
      icon: <ShieldAlert className={`${patient.allergies ? 'text-amber-500' : 'text-emerald-500'}`} size={16} />,
      color: patient.allergies ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
    },
    {
      id: 'chronic',
      label: 'Chronic Diseases',
      value: patient.existingDiseases || 'None Reported',
      icon: <Activity className={`${patient.existingDiseases ? 'text-indigo-500' : 'text-slate-400'}`} size={16} />,
      color: patient.existingDiseases ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500'
    }
  ];

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-700">
      {alerts.map((alert) => (
        <div 
          key={alert.id}
          className={`flex items-center gap-4 p-4 rounded-2xl border ${alert.color} transition-all hover:scale-[1.02] shadow-sm`}
        >
          <div className="shrink-0 p-2.5 bg-white rounded-xl shadow-sm">
            {alert.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60 mb-0.5">{alert.label}</p>
            <p className="text-sm font-black truncate">{alert.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClinicalAlertBanner;
