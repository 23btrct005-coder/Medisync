import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { 
  LayoutList, History as HistoryIcon, Loader2, Plus, Download, ChevronRight,
  RefreshCw, Search, ShieldCheck, Sparkles, Activity, Clock,
  Database, Target, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import MedicalTimeline from '../components/MedicalTimeline';
import AiSummaryModal from '../components/AiSummaryModal';
import ReportPreviewModal from '../components/ReportPreviewModal';

const MedicalHistory = () => {
    const [records, setRecords] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('timeline'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [lastSyncTime, setLastSyncTime] = useState(new Date());
    const [syncLabel, setSyncLabel] = useState('Just Now');
    const [summaryModal, setSummaryModal] = useState({
      isOpen: false,
      jsonData: null,
      legacyReasoning: null,
      reportId: null
    });
    const [downloadingId, setDownloadingId] = useState(null);
    const [previewData, setPreviewData] = useState({
        isOpen: false,
        url: null,
        name: '',
        type: ''
    });
    const navigate = useNavigate();

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

    const handlePreviewReport = async (report) => {
        setDownloadingId(report.id);
        try {
            const res = await api.get(`reports/download/${report.id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: report.fileType }));
            setPreviewData({
                isOpen: true,
                url,
                name: report.fileName,
                type: report.fileType
            });
        } catch (error) {
            console.error("Preview failed", error);
            toast.error("Failed to load clinical preview.");
        } finally {
            setDownloadingId(null);
        }
    };

    const closePreview = () => {
        if (previewData.url) window.URL.revokeObjectURL(previewData.url);
        setPreviewData({ ...previewData, isOpen: false, url: null });
    };

    const handleDownload = async (id, fileName) => {
        setDownloadingId(id);
        try {
            const res = await api.get(`reports/download/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Failed to download clinical record.");
        } finally {
            setDownloadingId(null);
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [recordsRes, prescriptionsRes, reportsRes] = await Promise.all([
                api.get('records/my-records'),
                api.get('prescriptions/my'),
                api.get('reports/my')
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

    const allEvents = [
        ...(records || []).map(r => ({ ...r, type: 'CONSULTATION', timestamp: r.date ? new Date(r.date) : new Date(0) })),
        ...(prescriptions || []).map(p => ({ ...p, type: 'PRESCRIPTION', timestamp: p.createdAt ? new Date(p.createdAt) : new Date(0) })),
        ...(reports || []).map(r => ({ ...r, type: 'REPORT', timestamp: r.documentDate ? new Date(r.documentDate) : (r.uploadDate ? new Date(r.uploadDate) : (r.createdAt ? new Date(r.createdAt) : new Date(0))) }))
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
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 selection:bg-emerald-100">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Pro Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Clinical Journey</h1>
                             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                                   {syncLabel === 'Just Now' ? 'Secure Node Connected' : `Synced ${syncLabel}`}
                                </span>
                             </div>
                        </div>
                        <p className="text-slate-500 font-medium text-lg">Your "Unified Healthcare OS" diagnostic timeline.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                       <button 
                         onClick={fetchAllData}
                         className="p-4 bg-white text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl border border-slate-200 transition-all shadow-sm group"
                       >
                         <RefreshCw size={22} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
                       </button>
                       
                       <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                            <button 
                                onClick={() => setViewMode('timeline')}
                                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-white text-[#0A1A1A] shadow-md font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`}
                            >
                                <HistoryIcon size={20} />
                                <span className="text-[10px] uppercase tracking-widest">Timeline</span>
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-[#0A1A1A] shadow-md font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`}
                            >
                                <LayoutList size={20} />
                                <span className="text-[10px] uppercase tracking-widest">Grid</span>
                            </button>
                       </div>
                       
                       <button onClick={handleExport} className="flex items-center gap-2 px-8 py-4 bg-[#0A1A1A] hover:bg-emerald-600 text-white rounded-2xl transition-all font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 shadow-emerald-500/5">
                         <Download size={18} />
                         Export Archive
                       </button>
                    </div>
                </div>

                {/* Filter & Connectivity Hub */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-8 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input 
                          type="text" 
                          placeholder="Search clinical findings, diagnoses, or physicians..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-white border border-slate-100 rounded-[2rem] pl-16 pr-6 py-5 text-sm font-bold shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="lg:col-span-4 flex items-center justify-end gap-3 px-6 py-5 bg-[#0A1A1A] rounded-[2rem] shadow-2xl border border-white/5 relative overflow-hidden group">
                        <ShieldCheck className="absolute -right-2 -bottom-2 text-white/5 group-hover:scale-110 transition-transform duration-1000" size={80} />
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">RLS Node Isolation Active</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Display */}
                <div className="pt-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 space-y-6">
                            <div className="relative">
                                <Loader2 className="text-emerald-500 animate-spin" size={64} />
                                <Activity className="absolute inset-0 m-auto text-emerald-300 opacity-30" size={32} />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Decrypting Journey</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Synchronizing Decentralized Nodes</p>
                            </div>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-40 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-xl"
                        >
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                <HistoryIcon className="text-slate-200" size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Records Found</h3>
                            <p className="text-slate-500 font-medium mb-8">Your clinical node has not yet synchronized any historical telemetry.</p>
                            <button 
                                onClick={() => navigate('/dashboard/reports')}
                                className="px-8 py-3 bg-[#0A1A1A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95"
                            >
                                Initialize First Sync
                            </button>
                        </motion.div>
                    ) : viewMode === 'timeline' ? (
                        <MedicalTimeline 
                          events={filteredEvents} 
                          onPreviewReport={handlePreviewReport} 
                          onViewAiSummary={(ev) => setSummaryModal({
                            isOpen: true,
                            jsonData: ev.aiSummary || ev.diagnosis,
                            legacyReasoning: ev.clinicalReasoning,
                            reportId: ev.id
                          })}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                            {filteredEvents.map(event => (
                                <ListCardPro key={event.id + event.type} record={event} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AiSummaryModal 
              isOpen={summaryModal.isOpen}
              onClose={() => setSummaryModal({ ...summaryModal, isOpen: false })}
              jsonData={summaryModal.jsonData}
              legacyReasoning={summaryModal.legacyReasoning}
              reportId={summaryModal.reportId}
            />

            <ReportPreviewModal 
              isOpen={previewData.isOpen}
              onClose={closePreview}
              reportUrl={previewData.url}
              reportName={previewData.name}
              fileType={previewData.type}
              onDownload={() => handleDownload(reports.find(r => r.fileName === previewData.name)?.id || downloadingId, previewData.name)}
            />
        </div>
    );
};

/* --- SUBCOMPONENTS --- */

const ListCardPro = ({ record }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all"
    >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-700" />
        
        <div className="flex items-start justify-between mb-8">
            <div className={`p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform ${record.type === 'REPORT' ? 'bg-emerald-50 text-emerald-600' : record.type === 'PRESCRIPTION' ? 'bg-blue-50 text-blue-600' : 'bg-[#0A1A1A] text-white'}`}>
                {record.type === 'REPORT' ? <Database size={24} /> : record.type === 'PRESCRIPTION' ? <Target size={24} /> : <Activity size={24} />}
            </div>
            <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Diagnostic Visit</p>
                <div className="flex items-center gap-2 justify-end">
                    <Clock size={12} className="text-slate-300" />
                    <span className="text-sm font-black text-slate-800">{record.date ? new Date(record.date).toLocaleDateString() : 'SYNC'}</span>
                </div>
            </div>
        </div>
        
        <div className="mb-6 h-[5.5rem] flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg mb-3 border border-slate-100 w-fit">
               <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">{record.type} Node</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter truncate leading-tight" title={record.diagnosis}>{record.diagnosis}</h3>
        </div>
        
        <div className="space-y-6">
            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 relative group-hover:bg-white transition-colors">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Decrypted Telemetry</p>
                <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed italic">
                    "{record.prescription || record.observations || 'Secure clinical findings recorded.'}"
                </p>
                <Sparkles size={14} className="absolute bottom-4 right-4 text-emerald-500/30 group-hover:text-emerald-500 transition-colors" />
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-emerald-500 text-[10px] shadow-sm">Dr</div>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest pb-0.5 border-b border-dashed border-slate-200">Dr. {record.doctorName || 'OS System'}</span>
                </div>
                <ArrowUpRight size={18} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
        </div>
    </motion.div>
);

export default MedicalHistory;
