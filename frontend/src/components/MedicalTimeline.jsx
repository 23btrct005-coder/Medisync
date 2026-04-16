import React from 'react';
import { Calendar, ChevronRight, Clipboard, User, HeartPulse } from 'lucide-react';

const MedicalTimeline = ({ records = [] }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
        <HeartPulse className="mx-auto text-slate-200 mb-4" size={64} />
        <p className="text-slate-400 font-medium italic">Your medical journey is just beginning.</p>
      </div>
    );
  }

  // Sort records by date descending
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {sortedRecords.map((record, index) => (
        <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Dot */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 text-slate-400 shadow group-[.is-active]:bg-primary group-[.is-active]:text-primary-foreground absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10 transition-transform duration-500 group-hover:scale-125">
            <Clipboard size={16} />
          </div>

          {/* Content Card */}
          <div className="w-[calc(100%-4rem)] md:w-[45%] glass-panel p-6 shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300 transform group-hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <time className="font-black text-[10px] uppercase tracking-widest text-primary">
                {new Date(record.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </time>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Calendar size={12} />
                Medical Entry
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">
              {record.diagnosis}
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Prescription</p>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 italic">
                  "{record.prescription}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <User size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Physician</p>
                    <p className="text-xs font-bold text-slate-700 truncate">Dr. {record.doctorName}</p>
                  </div>
                </div>
                <button className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MedicalTimeline;
