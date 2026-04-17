import React, { useState, useEffect } from 'react';
import { X, Sparkles, FileDown } from 'lucide-react';
import StructuredAiReport from './StructuredAiReport';
import api from '../api/axiosConfig';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const AiSummaryModal = ({ isOpen, onClose, jsonData, legacyReasoning, reportId }) => {
  const [liveJson, setLiveJson] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  // Reset state whenever this modal opens for a (potentially different) report
  useEffect(() => {
    if (isOpen) {
      setLiveJson(null);
      setIsAnalyzing(false);
      setAnalyzeError(null);
    }
  }, [isOpen, reportId]);

  // handleAnalyzeNow MUST be defined before any conditional returns
  const handleAnalyzeNow = async () => {
    if (isAnalyzing) return;
    if (!reportId) {
      setAnalyzeError('Report ID not found. Please close and reopen the summary.');
      return;
    }
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await api.post(`reports/${reportId}/reanalyze`);
      const freshSummary = res.data?.aiSummary ?? res.data;
      setLiveJson(typeof freshSummary === 'string' ? freshSummary : JSON.stringify(freshSummary));
    } catch (e) {
      console.error('Re-analyze from modal failed:', e);
      setAnalyzeError('Analysis failed. The AI service may be busy — please try again in a moment.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPdf = async () => {
    const element = document.getElementById('clinical-report-content');
    if (!element) return;

    const toastId = toast.loading('Generating Clinical Briefing...');
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MediSync_Briefing_${reportId || 'Clinical'}.pdf`);
      toast.success('Clinical Briefing exported!', { id: toastId });
    } catch (error) {
      console.error('PDF Export failed:', error);
      toast.error('Failed to generate PDF.', { id: toastId });
    }
  };

  if (!isOpen) return null;

  // Prefer fresh re-analysis data over the stored data
  const activeJson = liveJson || jsonData;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
                <Sparkles size={20} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 leading-none">Intelligence Insight</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Consolidated Diagnostic Briefing</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportPdf}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group/btn active:scale-95"
            >
              <FileDown size={14} className="group-hover/btn:translate-y-0.5" />
              Export Briefing
            </button>
            <button 
              onClick={onClose}
              className="p-3 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all border border-slate-100 active:scale-95"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
           <div id="clinical-report-content" className="p-2">
             {analyzeError && (
               <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-700">
                 ⚠️ {analyzeError}
               </div>
             )}
             <StructuredAiReport 
               jsonData={activeJson} 
               legacyReasoning={legacyReasoning}
               reportId={reportId}
               onAnalyzeNow={handleAnalyzeNow}
               isAnalyzing={isAnalyzing}
             />
           </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Standardized Clinical Intelligence v1.2 • AI Secured Pulse
           </p>
        </div>
      </div>
    </div>
  );
};

export default AiSummaryModal;
