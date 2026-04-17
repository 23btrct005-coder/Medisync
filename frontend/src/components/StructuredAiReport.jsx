import React from 'react';
import { 
  User, Clipboard, AlertTriangle, Pill, Calendar, 
  CheckCircle2, Info, Activity, ShieldAlert
} from 'lucide-react';

const StructuredAiReport = ({ jsonData }) => {
  let report = null;
  let parseError = false;

  try {
    if (typeof jsonData === 'string') {
      report = JSON.parse(jsonData);
    } else {
      report = jsonData;
    }
  } catch (e) {
    parseError = true;
  }

  if (parseError || !report) {
    return (
      <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
        <Info className="mx-auto text-slate-300 mb-3" size={32} />
        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Legacy Format Detected</h4>
        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Raw Analysis Available in Notes</p>
        <div className="mt-4 p-4 bg-white rounded-2xl text-left border border-slate-100 italic text-slate-500 text-xs leading-relaxed">
          {typeof jsonData === 'string' ? jsonData : 'Analysis data is malformed.'}
        </div>
      </div>
    );
  }

  if (report.error) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] flex items-center gap-4">
        <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-red-900 uppercase tracking-widest">Security or Service Alert</h4>
          <p className="text-xs font-bold text-red-600 mt-0.5">{report.error}</p>
        </div>
      </div>
    );
  }

  const Section = ({ icon: Icon, title, children, colorClass = "text-primary" }) => (
    <div className="py-6 first:pt-0 last:pb-0">
      <h4 className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] mb-4 ${colorClass}`}>
        <Icon size={14} />
        {title}
      </h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );

  const BulletList = ({ items, emptyText = "Not Available" }) => {
    if (!items || items.length === 0 || (items.length === 1 && items[0] === "Not Available")) {
      return <p className="text-xs font-bold text-slate-400 italic uppercase tracking-widest ml-6">{emptyText}</p>;
    }
    return (
      <ul className="space-y-2.5 ml-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 group">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary transition-colors shrink-0" />
            <span className="text-sm font-bold text-slate-700 leading-tight">{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-left">
      {/* High-Impact Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-slate-100 bg-slate-50/50">
        <div className="p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <User size={12} className="text-slate-400" /> Patient Info
          </p>
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-900">{report.patient_info?.name || 'N/A'}</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
               {report.patient_info?.age || 'N/A'} • {report.patient_info?.date || 'N/A'}
            </p>
          </div>
        </div>
        <div className="p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Activity size={12} className="text-emerald-500" /> Diagnosis
          </p>
          <p className="text-sm font-black text-emerald-900 leading-tight">
            {report.diagnosis || 'Pending Review'}
          </p>
        </div>
        <div className="p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-primary" /> Confidence
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-primary leading-none">{report.confidence || '0%'}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pb-1">AI Assurance Index</span>
          </div>
        </div>
      </div>

      <div className="p-8 divide-y divide-slate-100">
        <Section icon={Clipboard} title="Key Findings & Vitals" colorClass="text-indigo-600">
          <BulletList items={report.key_findings} />
        </Section>

        {report.critical_alerts && report.critical_alerts.length > 0 && report.critical_alerts[0] !== "Not Available" && (
          <Section icon={AlertTriangle} title="Critical Alerts" colorClass="text-red-600">
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
              <BulletList items={report.critical_alerts} />
            </div>
          </Section>
        )}

        <Section icon={Pill} title="Treatment Plan" colorClass="text-emerald-600">
          <BulletList items={report.treatment} />
        </Section>

        <Section icon={Calendar} title="Clinical Follow-up" colorClass="text-orange-600">
          <BulletList items={report.follow_up} />
        </Section>

        {report.additional_notes && report.additional_notes.length > 0 && report.additional_notes[0] !== "Not Available" && (
          <Section icon={Info} title="Physician Context" colorClass="text-slate-500">
            <BulletList items={report.additional_notes} />
          </Section>
        )}
      </div>

      <div className="px-8 py-4 bg-slate-50 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          Structured Diagnostic Intelligence
        </div>
        <div>Standardized Clinical Schema v1.0</div>
      </div>
    </div>
  );
};

export default StructuredAiReport;
