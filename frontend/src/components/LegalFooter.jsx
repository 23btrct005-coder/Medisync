import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Bot } from 'lucide-react';

const LegalFooter = ({ className = "" }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className={`mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4 ${className}`}>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        <Link 
          to="/privacy-policy" 
          className="group flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest"
        >
          <ShieldCheck size={14} className="group-hover:scale-110 transition-transform" />
          Privacy Policy
        </Link>
        <Link 
          to="/terms-of-service" 
          className="group flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest"
        >
          <FileText size={14} className="group-hover:scale-110 transition-transform" />
          Terms of Service
        </Link>
        <Link 
          to="/ai-disclaimer" 
          className="group flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest"
        >
          <Bot size={14} className="group-hover:scale-110 transition-transform" />
          AI Disclaimer
        </Link>
      </div>
      
      <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-medium">
        &copy; {currentYear} Medisync Healthcare Portal. All rights reserved.
      </p>
    </div>
  );
};

export default LegalFooter;
