import React from 'react';
import { Calendar, ChevronRight, Clipboard, User, HeartPulse, FileText, Pill, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MedicalTimeline = ({ events = [] }) => {
  const navigate = useNavigate();

  if (events.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
        <HeartPulse className="mx-auto text-slate-200 mb-4" size={64} />
        <p className="text-slate-400 font-medium italic">Your medical journey is just beginning.</p>
      </div>
    );
  }

  // Group events by Month and Year for "Doctors LOVE timeline view"
  const groupedEvents = [];
  let currentMonthYear = '';

  events.forEach((event) => {
    const date = new Date(event.timestamp);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    
    if (monthYear !== currentMonthYear) {
      groupedEvents.push({ type: 'HEADER', label: monthYear });
      currentMonthYear = monthYear;
    }
    groupedEvents.push(event);
  });

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {groupedEvents.map((item, index) => {
        if (item.type === 'HEADER') {
          return (
            <div key={`header-${index}`} className="relative flex justify-center z-10">
              <span className="px-4 py-1.5 bg-slate-900 shadow-xl rounded-full text-[10px] font-black text-white uppercase tracking-[0.3em] border-2 border-white">
                {item.label}
              </span>
            </div>
          );
        }

        const isPrescription = item.type === 'PRESCRIPTION';
        const medications = isPrescription ? JSON.parse(item.medications || '[]') : [];

        return (
          <div key={item.id + item.type} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-4">
            {/* Dot */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-lg absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10 transition-all duration-500 group-hover:scale-125 group-hover:shadow-primary/20 ${isPrescription ? 'bg-primary text-white' : 'bg-indigo-500 text-white'}`}>
              {isPrescription ? <Pill size={16} /> : <FileText size={16} />}
            </div>

            {/* Content Card */}
            <div className={`w-[calc(100%-4rem)] md:w-[45%] glass-panel p-6 shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300 transform group-hover:-translate-y-1 border-l-4 ${isPrescription ? 'border-l-primary' : 'border-l-indigo-500'}`}>
              <div className="flex items-center justify-between mb-3">
                <time className={`font-black text-[10px] uppercase tracking-[0.2em] ${isPrescription ? 'text-primary' : 'text-indigo-600'}`}>
                  {new Date(item.timestamp).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </time>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {isPrescription ? <Pill size={12} /> : <Clipboard size={12} />}
                  {isPrescription ? 'E-Prescription' : 'Clinical Entry'}
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight tracking-tight flex items-center gap-2">
                {item.diagnosis || 'General Consultation'}
                <ChevronRight size={20} className="text-slate-200 group-hover:text-primary transition-colors" />
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    {isPrescription ? <Pill size={12} className="text-primary" /> : <Clipboard size={12} className="text-indigo-500" />}
                    Medical Status → {item.diagnosis ? 'Active Case' : 'Routine'}
                  </p>
                  
                  {isPrescription ? (
                    <div className="space-y-2">
                      {medications.slice(0, 2).map((med, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0 border-dashed">
                           <span className="font-bold text-slate-700">{med.name}</span>
                           <span className="text-slate-400 font-medium">{med.dosage} • {med.duration}</span>
                        </div>
                      ))}
                      {medications.length > 2 && (
                        <p className="text-[9px] font-bold text-primary uppercase pt-1">+{medications.length - 2} more medications</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 leading-relaxed font-semibold italic">
                      "{item.prescription}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm ${isPrescription ? 'bg-primary/10 text-primary' : 'bg-indigo-50 text-indigo-600'}`}>
                      {isPrescription ? item.doctor?.name?.charAt(0) || 'D' : item.doctorName?.charAt(0) || 'D'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medical Officer</p>
                      <p className="text-xs font-black text-slate-800 truncate">
                        Dr. {isPrescription ? (item.doctor?.name || 'Assigned') : (item.doctorName || 'Assigned')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MedicalTimeline;
