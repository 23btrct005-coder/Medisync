import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import StructuredAiReport from './StructuredAiReport';
import api from '../api/axiosConfig';

const AiSummaryModal = ({ isOpen, onClose, jsonData, legacyReasoning, reportId }) => {
  const [liveJson, setLiveJson] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen) return null;

  // Always prefer liveJson (from re-analysis) over the original stored data
  const activeJson = liveJson || jsonData;

  const handleAnalyzeNow = async () => {
    if (!reportId || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await api.post(`reports/${reportId}/reanalyze`);
      setLiveJson(res.data.aiSummary);
    } catch (e) {
      console.error('Re-analyze from modal failed:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
          <button 
            onClick={onClose}
            className="p-3 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all border border-slate-100 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
           <StructuredAiReport 
             jsonData={activeJson} 
             legacyReasoning={legacyReasoning}
             reportId={reportId}
             onAnalyzeNow={handleAnalyzeNow}
             isAnalyzing={isAnalyzing}
           />
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
