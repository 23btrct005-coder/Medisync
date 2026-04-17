import React from 'react';
import { Pill, Clock, AlertCircle, Calendar, ChevronRight } from 'lucide-react';

const ActiveMedicationTracker = ({ prescriptions = [] }) => {
  if (prescriptions.length === 0) return null;

  // Flatten and filter for active-looking meds (simplified for now: latest 5 items)
  const allMeds = prescriptions.flatMap(p => {
    try {
      const parsed = JSON.parse(p.medications || '[]');
      return parsed.map(m => ({ ...m, date: p.createdAt, doctor: p.doctor?.name }));
    } catch (e) {
      return [];
    }
  });

  // Get unique medications by name, taking the latest one
  const activeMeds = Array.from(new Map(allMeds.map(m => [m.name, m])).values())
    .slice(0, 4);

  return (
    <div className="glass-panel p-8 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Pill size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Medication Radar</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Live Clinical Course</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeMeds.length === 0 ? (
          <div className="col-span-full py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Prescriptions Detected</p>
          </div>
        ) : (
          activeMeds.map((med, idx) => (
            <div key={idx} className="relative group overflow-hidden bg-white border border-slate-100 rounded-2xl p-4 transition-all hover:border-primary/30 hover:shadow-lg shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-xl ${idx % 2 === 0 ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  <Pill size={16} />
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-md">{med.duration}</span>
              </div>
              
              <h4 className="text-sm font-black text-slate-800 line-clamp-1 mb-1">{med.name}</h4>
              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-3">
                <Clock size={10} className="text-primary" /> {med.dosage} • {med.frequency}
              </p>
              
              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-300 uppercase">Prescribed By</span>
                     <span className="text-[9px] font-bold text-slate-600 truncate max-w-[80px]">{(med.doctor || 'Physician').startsWith('Dr.') ? med.doctor : `Dr. ${med.doctor || 'Physician'}`}</span>
                  </div>
                 <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                    <ChevronRight size={12} className="text-slate-300" />
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
         <AlertCircle className="text-amber-500 mt-0.5" size={16} />
         <div>
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-0.5">Clinical Protocol</p>
            <p className="text-[10px] text-amber-700 font-medium leading-relaxed">Always confirm dosage with your physician before making adherence changes. Telemetry sync is active.</p>
         </div>
      </div>
    </div>
  );
};

export default ActiveMedicationTracker;
