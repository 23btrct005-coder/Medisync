import React, { useState } from 'react';
import { 
  Stethoscope, FileText, Plus, Search, 
  MoreHorizontal, ChevronRight, Eye, Sparkles, 
  Download, Filter, Clipboard, Pill, Clock
} from 'lucide-react';

const MedicalTimeline = ({ events = [], onPreviewReport, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Consultations', 'Reports', 'Prescriptions', 'Follow-ups'];

  const filteredEvents = events.filter(event => {
    const matchesSearch = (
      (event.diagnosis?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (event.fileName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (event.prescription?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const typeLower = event.type?.toLowerCase() || '';
    const matchesFilter = activeFilter === 'All' || 
      (activeFilter === 'Consultations' && typeLower === 'consultation') ||
      (activeFilter === 'Reports' && typeLower === 'report') ||
      (activeFilter === 'Prescriptions' && typeLower === 'prescription') ||
      (activeFilter === 'Follow-ups' && typeLower === 'follow_up');

    return matchesSearch && matchesFilter;
  });

  if (events.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
        <Clock className="mx-auto text-slate-200 mb-4" size={64} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Awaiting Clinical Entries</p>
      </div>
    );
  }

  const EventCard = ({ event }) => {
    const isConsultation = event.type === 'CONSULTATION';
    const isReport = event.type === 'REPORT';
    const isFollowUp = event.type === 'FOLLOW_UP';
    const isPrescription = event.type === 'PRESCRIPTION';

    const date = new Date(event.timestamp).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

    // Determine Theme
    const isWarningAction = isFollowUp;
    const nodeColor = isWarningAction ? 'bg-amber-400' : 'bg-blue-600';
    const iconColor = isWarningAction ? 'text-amber-500' : 'text-blue-500';
    const bgColor = isWarningAction ? 'bg-amber-50' : 'bg-blue-50';

    return (
      <div className="relative pl-12 pb-12 last:pb-0 group">
        {/* Timeline Node */}
        <div className={`absolute left-0 top-0 w-10 h-10 rounded-full ${nodeColor} border-4 border-white shadow-lg z-10 flex items-center justify-center text-white transform group-hover:scale-110 transition-transform duration-300`}>
          {isConsultation && <Stethoscope size={18} />}
          {isReport && <FileText size={18} />}
          {isFollowUp && <Plus size={18} />}
          {isPrescription && <Pill size={18} />}
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-left relative">
           <div className="p-6">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className={`p-2 ${bgColor} ${iconColor} rounded-xl`}>
                      {isConsultation && <Stethoscope size={18} />}
                      {isReport && <FileText size={18} />}
                      {isFollowUp && <Plus size={18} />}
                      {isPrescription && <Pill size={18} />}
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{date}</h4>
                      <h3 className="text-sm font-black text-slate-900 leading-none">
                        {isConsultation && "Physician Consultation"}
                        {isReport && "Medical Report Uploaded"}
                        {isFollowUp && "Clinical Follow-up"}
                        {isPrescription && "Digital Prescription"}
                      </h3>
                   </div>
                </div>
                <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Card Body */}
              <div className="space-y-4">
                {/* Diagnosis / Condition Section */}
                {(event.diagnosis || event.conditionUpdate) && (
                  <div className="border-t border-slate-50 pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Assessment</p>
                    <p className="text-sm font-bold text-slate-800">
                      {event.diagnosis || event.conditionUpdate}
                    </p>
                  </div>
                )}

                {/* Bullets (Symptoms or Briefs) */}
                {isConsultation && event.symptoms && event.symptoms.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {event.symptoms.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span className="text-xs font-bold text-slate-600">{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {isReport && (
                   <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <FileText size={14} className="text-blue-500" />
                      <span className="text-[11px] font-black text-blue-900 uppercase tracking-tight truncate max-w-[200px]">
                        {event.fileName}
                      </span>
                   </div>
                )}

                {isFollowUp && (
                   <div className="text-xs font-bold text-slate-600 italic bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                      "{event.patientReport || 'No additional report provided.'}"
                   </div>
                )}

                {/* Prescription Footer */}
                {(isConsultation || isPrescription) && event.prescription && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Recommended Management</p>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                      {event.prescription}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   {isReport && (
                     <button 
                        onClick={() => onPreviewReport(event)}
                        className="btn-premium py-2 px-4 text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                     >
                        <Eye size={12} /> View Full Report
                     </button>
                   )}
                   {(isConsultation || isReport) && (
                     <button className="group relative p-2 bg-slate-900 text-white rounded-xl hover:bg-primary transition-all">
                        <Sparkles size={14} />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-[8px] font-black text-white uppercase tracking-widest rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                           View AI Summary
                        </span>
                     </button>
                   )}
                </div>
                {!isReport && (
                   <button className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-primary transition-all uppercase tracking-widest">
                      <ChevronRight size={14} /> View Details
                   </button>
                )}
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Premium Header */}
      <div className="mb-10 space-y-6">
        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search clinical journey..."
            className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                activeFilter === f 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Central Line */}
        <div className="absolute left-[19.5px] top-6 bottom-6 w-0.5 bg-slate-100" />

        <div className="space-y-4">
          {filteredEvents.length > 0 ? filteredEvents.map((event, idx) => (
            <EventCard key={event.id || idx} event={event} />
          )) : (
            <div className="text-center py-12">
               <Filter className="mx-auto text-slate-100 mb-4" size={48} />
               <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No matches found in this criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalTimeline;
