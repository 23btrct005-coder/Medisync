import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

const ReportPreviewModal = ({ isOpen, onClose, reportUrl, reportName, fileType, onDownload }) => {
  if (!isOpen) return null;

  const isImage = fileType?.toLowerCase().startsWith('image/');
  const isPdf = fileType?.toLowerCase() === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md cursor-pointer" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full h-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-800 truncate uppercase tracking-widest">{reportName}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Clinical Document Preview</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onDownload}
              className="p-3 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
              title="Download Original"
            >
              <Download size={20} />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button 
              onClick={onClose}
              className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Preview Area */}
        <div className="flex-1 bg-slate-200 overflow-auto flex items-center justify-center p-4">
          {isPdf ? (
            <iframe 
              src={`${reportUrl}#toolbar=0`} 
              className="w-full h-full rounded-xl shadow-lg border border-slate-300 bg-white"
              title="Clinical Report PDF"
            />
          ) : isImage ? (
            <div className="relative group max-w-full">
               <img 
                 src={reportUrl} 
                 alt={reportName} 
                 className="max-w-full max-h-full rounded-xl shadow-2xl border-4 border-white transition-transform duration-500 ease-out" 
               />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl pointer-events-none">
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/30">
                     Diagnostic Media Preview
                  </span>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-8 bg-white rounded-[2rem] shadow-xl text-slate-200">
                <ExternalLink size={64} />
              </div>
              <div className="space-y-2">
                <p className="text-slate-600 font-black uppercase tracking-widest text-sm">Preview Unavailable</p>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest leading-relaxed">
                  This document type requires a local viewer.<br/>Please use the download option above.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            Secure Node Synchronization Active
          </div>
          <span>Medisync High-Fidelity Viewer</span>
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewModal;
