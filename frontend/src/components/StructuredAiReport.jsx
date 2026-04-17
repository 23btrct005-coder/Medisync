import { 
  User, Clipboard, AlertTriangle, Pill, Calendar, 
  CheckCircle2, Info, Activity, ShieldAlert, Zap,
  RefreshCw, Loader2, BrainCircuit
} from 'lucide-react';

const StructuredAiReport = ({ jsonData, legacyReasoning, reportId, onAnalyzeNow, isAnalyzing }) => {
  let report = null;
  let isJson = false;

  try {
    if (typeof jsonData === 'string') {
      report = JSON.parse(jsonData);
      isJson = true;
    } else {
      report = jsonData;
      isJson = true;
    }
  } catch (e) {
    isJson = false;
  }

  // Helper to convert plain text to bullets if it's not JSON
  const textToBullets = (text) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) return [];
    return text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 5);
  };

  if (!isJson || !report) {
    // Legacy / non-JSON data — show a premium CTA to generate structured analysis
    return (
      <div className="py-6 flex flex-col items-center text-center gap-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-2xl shadow-slate-300">
          <BrainCircuit size={38} className="text-white" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Structured Analysis Not Available
          </h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            This report was analyzed before the structured intelligence engine was available. 
            Run a fresh analysis to unlock the full diagnostic briefing.
          </p>
        </div>

        {/* Feature preview chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['Patient Info', 'Key Findings', 'Treatment Plan', 'Follow-up', 'Confidence Score'].map(f => (
            <span key={f} className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
              {f}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        {onAnalyzeNow && (
          <button
            onClick={onAnalyzeNow}
            disabled={isAnalyzing}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <><Loader2 size={18} className="animate-spin" /> Generating Analysis...</>
            ) : (
              <><RefreshCw size={18} /> Generate Structured Analysis</>
            )}
          </button>
        )}

        {isAnalyzing && (
          <p className="text-xs text-slate-400 font-bold animate-pulse">
            AI is reading the document... this may take 10–20 seconds.
          </p>
        )}
      </div>
    );
  }

  if (report.error) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] flex items-center gap-4 text-left">
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

  const diagStr = (report.diagnosis || '').toString().toUpperCase().trim();
  const isInconclusive = 
    diagStr === 'INCONCLUSIVE_DATA_SIGNAL' || 
    diagStr === 'NOT AVAILABLE' ||
    diagStr === 'N/A' ||
    (report.diagnosis == null && (!report.key_findings || report.key_findings.filter(Boolean).length === 0));

  if (isInconclusive) {
    return (
      <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 mx-auto mb-6">
           <AlertTriangle size={32} />
        </div>
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Inconclusive Clinical Signal</h3>
        <p className="text-xs text-slate-500 font-bold leading-relaxed mb-8">
           AI was unable to extract digital telemetry from this document. This usually occurs with scanned physical reports or low-resolution images.
        </p>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-left space-y-3">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Optimization Steps:</p>
           <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
              <p className="text-[11px] font-bold text-slate-600">Upload digital-first PDF reports (e.g., from lab portals).</p>
           </div>
           <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
              <p className="text-[11px] font-bold text-slate-600">Ensure physical scans are well-lit and flat.</p>
           </div>
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

  const BulletList = ({ items, emptyText = "No data extracted" }) => {
    const validItems = (items || []).filter(item => item != null && typeof item === 'string' && item.trim().length > 0 && item.toUpperCase() !== 'NOT AVAILABLE' && item.toUpperCase() !== 'N/A');
    if (validItems.length === 0) {
      return <p className="text-xs font-bold text-slate-300 italic tracking-widest ml-6">{emptyText}</p>;
    }
    return (
      <ul className="space-y-2.5 ml-1">
        {validItems.map((item, idx) => (
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
            <p className="text-sm font-black text-slate-900">{report.patient_info?.name || 'Patient'}</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
               Age: {report.patient_info?.age || '—'} • {report.patient_info?.date ? new Date(report.patient_info.date).toLocaleDateString() : 'Date unavailable'}
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

        {report.critical_alerts && report.critical_alerts.filter(a => a != null && a.toUpperCase() !== 'NOT AVAILABLE').length > 0 && (
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

        {report.additional_notes && report.additional_notes.filter(n => n != null && n.toUpperCase() !== 'NOT AVAILABLE').length > 0 && (
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
