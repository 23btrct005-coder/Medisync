import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axiosConfig';
import { 
    Download, FileText, Loader2, UploadCloud, Camera, X, Trash2,
    Sparkles, Eye, MessageSquare, Clock, Filter, CheckCircle2, AlertCircle, Search,
    RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import AiChatSidebar from '../components/AiChatSidebar';
import SkeletonCard from '../components/SkeletonCard';
import ReportPreviewModal from '../components/ReportPreviewModal';
import StructuredAiReport from '../components/StructuredAiReport';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);
  
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [syncLabel, setSyncLabel] = useState('Just Now');
  const [revealedAiReports, setRevealedAiReports] = useState({});

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

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  const [selectedReport, setSelectedReport] = useState(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [previewData, setPreviewData] = useState({
    isOpen: false,
    url: null,
    name: '',
    type: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('reports/my');
      const data = res.data || [];
      const sorted = data.sort((a, b) => new Date(b.documentDate || b.uploadDate || 0) - new Date(a.documentDate || a.uploadDate || 0));
      setReports(sorted);
    } catch (error) {
      console.error("Failed to load reports", error);
    } finally {
      setLoading(false);
      setLastSyncTime(new Date());
      setSyncLabel('Just Now');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success("Report uploaded successfully!");
      fetchReports();
    } catch (err) {
      console.error("Upload failed", err);
      toast.error(err.response?.data?.message || "Failed to securely upload report.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      toast.error("Unable to access the camera.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const width = videoRef.current.videoWidth || 640;
      const height = videoRef.current.videoHeight || 480;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "scanned_report.jpg", { type: "image/jpeg" });
        stopCamera();
        
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        try {
          await api.post('reports/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          fetchReports();
        } catch (err) {
           console.error("Upload failed", err);
        } finally {
          setUploading(false);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handlePreview = async (report) => {
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

  const handleDownload = async (id, fileName) => {
    if (!id) return;
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
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Failed to securely download clinical document.");
    } finally {
      setDownloadingId(null);
    }
  };

  const closePreview = () => {
    if (previewData.url) window.URL.revokeObjectURL(previewData.url);
    setPreviewData({ ...previewData, isOpen: false, url: null });
  };

  const executeDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`reports/${id}`);
      setReports(reports.filter(r => r.id !== id));
      toast.success("Report deleted.");
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete report.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-800">Permanently delete this report?</p>
        <div className="flex gap-2">
          <button onClick={() => { toast.dismiss(t.id); executeDelete(id); }} className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold w-full">Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold w-full">Cancel</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const filteredReports = reports.filter(r => 
    r.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAiReveal = (reportId) => {
    setRevealedAiReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const handleAskAi = (report) => {
    setSelectedReport(report);
    setIsAiOpen(true);
  };

  return (
    <div className="page-entry space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Reports</h1>
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">{syncLabel === 'Just Now' ? 'Secure Sync Active' : `Synced ${syncLabel}`}</span>
             </div>
          </div>
          <p className="text-slate-500 font-medium">Synchronized repository of your diagnostic history</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchReports}
             className="p-3.5 bg-white text-slate-400 hover:text-primary hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all shadow-sm group"
           >
             <RefreshCw size={20} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin text-primary' : ''}`} />
           </button>
           <div className="hidden md:block h-8 w-px bg-slate-200 mx-1" />
           
           {/* Hidden File Input */}
           <input 
             type="file" 
             ref={fileInputRef}
             onChange={handleFileUpload}
             className="hidden"
             accept=".pdf,.jpg,.jpeg,.png"
           />

           <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all font-black text-sm shadow-xl active:scale-95">
             <UploadCloud size={18} />
             Upload Archive
           </button>
           <button onClick={startCamera} className="flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 rounded-2xl transition-all font-black text-sm shadow-sm active:scale-95">
             <Camera size={18} />
             Scan Physical
           </button>
           {uploading && (
             <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl text-primary animate-pulse">
               <Loader2 size={16} className="animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest">Uploading...</span>
             </div>
           )}
        </div>
      </div>

      {/* Filter Hub */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search report findings..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium pl-12"
          />
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : filteredReports.length === 0 ? (
          <div className="col-span-full text-center py-20 glass-panel border-dashed bg-slate-50/50">
            <FileText className="mx-auto text-slate-200 mb-4" size={64} />
            <h3 className="text-xl font-bold text-slate-800">No reports found</h3>
            <p className="text-slate-500 mt-2">Try uploading your first imaging report.</p>
          </div>
        ) : (
          filteredReports.map(report => (
            <div key={report.id} className="relative group animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="glass-card p-6 border-b-4 border-b-primary/40 hover:border-b-primary transition-all">
                {/* Floating Tags */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[9px] font-black text-slate-900 shadow-xl border border-white/50 flex items-center gap-2 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {report.fileType?.includes('pdf') ? 'Clinical Document' : 'Diagnostic Image'}
                  </div>
                  {(new Date() - new Date(report.uploadDate || report.date)) < 86400000 && (
                     <div className="px-3 py-1.5 bg-emerald-500 rounded-xl text-[9px] font-black text-white shadow-xl border border-emerald-400 flex items-center gap-2 uppercase tracking-widest animate-pulse">
                        <Sparkles size={10} />
                        New Report
                     </div>
                  )}
                  {!report.aiSummary && (
                    <div className="px-3 py-1.5 bg-amber-500 rounded-xl text-[9px] font-black text-white shadow-xl border border-amber-400 flex items-center gap-2 uppercase tracking-widest">
                      <Loader2 size={10} className="animate-spin" />
                      AI Analyzing...
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl shadow-sm">
                      <FileText size={24} />
                    </div>
                    <div className="min-w-0 text-left">
                      <h3 className="text-lg font-bold text-slate-800 truncate leading-tight">{report.fileName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Clock size={10} /> {new Date(report.documentDate || report.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <button 
                      onClick={() => handlePreview(report)}
                      disabled={downloadingId === report.id}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                      title="Preview Document"
                    >
                      {downloadingId === report.id ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                    </button>
                    <button 
                      onClick={() => handleDownload(report.id, report.fileName)}
                      disabled={downloadingId === report.id}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    <div className="w-px h-5 bg-slate-200 mx-1" />
                    <button 
                      onClick={() => toggleAiReveal(report.id)}
                      className={`p-2 rounded-xl transition-all ${revealedAiReports[report.id] ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}
                      title={revealedAiReports[report.id] ? "Minimize AI Insight" : "Maximize AI Insight"}
                    >
                      {!report.aiSummary ? (
                        <Loader2 size={18} className="animate-spin text-amber-500" />
                      ) : (
                        <Sparkles size={18} className={!revealedAiReports[report.id] ? 'animate-pulse' : ''} />
                      )}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                      disabled={deletingId === report.id}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Report"
                    >
                      {deletingId === report.id 
                        ? <Loader2 size={18} className="animate-spin text-red-400" /> 
                        : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>

                {/* AI Insight Section (Maximized only) */}
                {revealedAiReports[report.id] && (
                  <div className="mb-6 pt-4 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <span className="badge-clinical bg-primary text-white border-none py-0.5 px-3">Structured Clinical Briefing</span>
                         {report.monaiDiagnosis && <span className="badge-clinical bg-emerald-100 text-emerald-700 border-emerald-200 py-0.5">Vision Verified</span>}
                      </div>
                      <button 
                        onClick={() => toggleAiReveal(report.id)}
                        className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                      >
                        Minimize
                      </button>
                    </div>
                    <StructuredAiReport jsonData={report.aiSummary} />
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Securely Verified</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Camera UI Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-4">
           <button onClick={stopCamera} className="absolute top-6 right-6 text-white p-3 bg-slate-800 rounded-full hover:bg-slate-700">
             <X size={24} />
           </button>
           <div className="relative w-full max-w-2xl text-center">
              <h3 className="text-white text-xl font-bold mb-6">Align your clinical document</h3>
              <div className="w-full bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 relative shadow-2xl">
                 <video ref={videoRef} autoPlay playsInline onLoadedMetadata={() => videoRef.current?.play()} className="w-full h-auto"></video>
              </div>
              <canvas ref={canvasRef} className="hidden"></canvas>
              <button 
                onClick={capturePhoto} 
                className="mt-8 px-10 py-4 bg-emerald-600 rounded-full text-white font-bold text-lg hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Capture & Analyze
              </button>
           </div>
        </div>
      )}

      {/* Chat Sidebar Integration */}
      <AiChatSidebar 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        reportData={selectedReport}
      />

      <ReportPreviewModal 
        isOpen={previewData.isOpen}
        onClose={closePreview}
        reportUrl={previewData.url}
        reportName={previewData.name}
        fileType={previewData.type}
        onDownload={() => handleDownload(reports.find(r => r.fileName === previewData.name)?.id, previewData.name)}
      />
    </div>
  );
};

export default Reports;
