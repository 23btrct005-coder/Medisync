import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { 
  LayoutList, History, Loader2, Plus, Download, ChevronRight,
  RefreshCw, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MedicalTimeline from '../components/MedicalTimeline';
import AiSummaryModal from '../components/AiSummaryModal';

const MedicalHistory = () => {
    const [records, setRecords] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [lastSyncTime, setLastSyncTime] = useState(new Date());
    const [syncLabel, setSyncLabel] = useState('Just Now');
    const [summaryModal, setSummaryModal] = useState({
      isOpen: false,
      jsonData: null,
      legacyReasoning: null
    });
    const navigate = useNavigate();

    // Relative time formatter
    const getRelativeTime = (date) => {
        const diff = Math.floor((new Date() - date) / 1000);
        if (diff < 60) return 'Just Now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setSyncLabel(getRelativeTime(lastSyncTime));
        }, 30000);
        return () => clearInterval(timer);
    }, [lastSyncTime]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [recordsRes, prescriptionsRes, reportsRes] = await Promise.all([
                api.get('records/my-records'),
                api.get('prescriptions/my'),
                api.get('reports')
            ]);
            setRecords(recordsRes.data || []);
            setPrescriptions(prescriptionsRes.data || []);
            setReports(reportsRes.data || []);
        } catch (err) {
            console.error("Failed to fetch clinical data", err);
        } finally {
            setLoading(false);
            setLastSyncTime(new Date());
            setSyncLabel('Just Now');
        }
    };

    const handleExport = () => {
        const clinicalData = JSON.stringify({ records, prescriptions }, null, 2);
        const blob = new Blob([clinicalData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `medisync-clinical-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Clinical archive exported successfully.");
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Merge and sort for timeline
    const allEvents = [
        ...(records || []).map(r => ({ ...r, type: 'CONSULTATION', timestamp: r.date ? new Date(r.date) : new Date(0) })),
        ...(prescriptions || []).map(p => ({ ...p, type: 'PRESCRIPTION', timestamp: p.createdAt ? new Date(p.createdAt) : new Date(0) })),
        ...(reports || []).map(r => ({ ...r, type: 'REPORT', timestamp: r.uploadDate ? new Date(r.uploadDate) : (r.createdAt ? new Date(r.createdAt) : new Date(0)) }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    const filteredEvents = allEvents.filter(e => {
        const query = searchTerm.toLowerCase();
        return (
            (e.diagnosis?.toLowerCase().includes(query)) ||
            (e.doctorName?.toLowerCase().includes(query)) ||
            (e.doctor?.name?.toLowerCase().includes(query))
        );
    });

    return (
        <div className="page-entry space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-4xl font-black text-slate-900 tracking-tight">Medical Journey</h1>
                 <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                       {syncLabel === 'Just Now' ? 'Secure Node Connected' : `Synced ${syncLabel}`}
                    </span>
                 </div>
              </div>
              <p className="text-slate-500 font-medium">Verified chronological stream of your clinical history</p>
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                 onClick={fetchAllData}
                 className="p-3.5 bg-white text-slate-400 hover:text-primary hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all shadow-sm group"
               >
                 <RefreshCw size={20} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin text-primary' : ''}`} />
               </button>
               <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                    <button 
                        onClick={() => setViewMode('timeline')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'timeline' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <History size={20} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutList size={20} />
                    </button>
               </div>
               <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all font-black text-sm shadow-xl active:scale-95">
                 <Download size={18} />
                 Export Archive
               </button>
            </div>
        </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="py-1 px-3 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Live Clinical Stream
                   </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="btn-premium py-2 px-4 bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <Download size={14} />
                        Export Archive
                    </button>
                </div>
            </div>

            {/* Content Display */}
            <div className="pt-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="text-primary animate-spin" size={48} />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Decrypting Clinical Data...</p>
                    </div>
                ) : allEvents.length === 0 ? (
                    <div className="text-center py-32 glass-panel border-dashed bg-slate-50/50">
                        <History className="mx-auto text-slate-200 mb-4" size={64} />
                        <h3 className="text-xl font-bold text-slate-800">No records found</h3>
                        <p className="text-slate-500 mt-2">Adjust your filters or add a new record to get started.</p>
                    </div>
                ) : viewMode === 'timeline' ? (
                    <MedicalTimeline 
                      events={allEvents} 
                      onPreviewReport={(rep) => navigate(`/dashboard/reports`)} 
                      onViewAiSummary={(ev) => setSummaryModal({
                        isOpen: true,
                        jsonData: ev.aiSummary || ev.diagnosis,
                        legacyReasoning: ev.clinicalReasoning
                      })}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {allEvents.map(event => (
                            <ListCard key={event.id + event.type} record={event} />
                        ))}
                    </div>
                )}
            </div>

            <AiSummaryModal 
              isOpen={summaryModal.isOpen}
              onClose={() => setSummaryModal({ ...summaryModal, isOpen: false })}
              jsonData={summaryModal.jsonData}
              legacyReasoning={summaryModal.legacyReasoning}
            />
        </div>
    );
};

/* --- SUBCOMPONENTS --- */

const ListCard = ({ record }) => (
    <div className="glass-card p-6 group">
        <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-primary/5 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                <ClipboardList size={24} />
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Visit</p>
                <p className="text-sm font-bold text-slate-700">{record.date ? new Date(record.date).toLocaleDateString() : 'Historical'}</p>
            </div>
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2 truncate" title={record.diagnosis}>{record.diagnosis}</h3>
        
        <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[80px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Clinical Management</p>
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed italic">"{record.prescription}"</p>
            </div>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-primary/60" />
                    <span className="text-xs font-bold text-slate-500">{record.date ? new Date(record.date).getFullYear() : 'Sync'} Archive</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Dr. {record.doctorName}</span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </div>
    </div>
);

export default MedicalHistory;
