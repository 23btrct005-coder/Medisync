import React, { useState } from 'react';
import { 
  LifeBuoy, MessageSquare, BookOpen, Flag, 
  Search, ChevronRight, Activity, ArrowRight,
  Send, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';

const Support = () => {
  const [submitted, setSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    { q: 'How does AI analyze my laboratory reports?', a: 'Medisync uses advanced clinical models to parse raw data into actionable insights.' },
    { q: 'Who can access my emergency records?', a: 'Only verified medical professionals who have scanned your physical QR code or been explicitly granted access.' },
    { q: 'Is my medical telemetry HIPAA compliant?', a: 'Yes, all data is encrypted at rest and in transit with Row Level Security (RLS) isolation.' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="page-entry space-y-10 pb-12">
      {/* Search Hero */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl">
         <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/20 blur-[100px] pointer-events-none" />
         <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Support Infrastructure</h1>
            <p className="text-slate-400 font-medium">Synchronize with our technical specialists or browse clinical documentation.</p>
            <div className="relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
               <input 
                  type="text" 
                  placeholder="Search for clinical documentation, security protocols..." 
                  className="w-full bg-white/10 border border-white/20 backdrop-blur-xl rounded-[2rem] py-5 pl-16 pr-8 text-white focus:bg-white focus:text-slate-900 focus:outline-none transition-all focus:ring-4 focus:ring-primary/20"
               />
            </div>
         </div>
         <LifeBuoy className="absolute -left-12 -bottom-12 text-white/5" size={250} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* FAQ & Knowledge Base */}
         <div className="lg:col-span-12 xl:col-span-8 space-y-8">
            <div className="flex items-center justify-between mb-4">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Knowledge Base</h3>
                  <p className="text-sm text-slate-500 font-medium">Verified answers to common system queries</p>
               </div>
               <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                  View Full Wiki <ArrowRight size={14} />
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="glass-panel p-8 bg-primary/5 border-primary/10 group hover:bg-primary/10 transition-all cursor-pointer">
                  <BookOpen className="text-primary mb-4" size={32} />
                  <h4 className="text-lg font-extrabold text-slate-900 mb-2">Getting Started</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">Learn how to synchronize your insurance nodes and link your primary care physician.</p>
               </div>
               <div className="glass-panel p-8 bg-emerald-50 border-emerald-100 group hover:bg-emerald-100 transition-all cursor-pointer">
                  <Activity className="text-emerald-600 mb-4" size={32} />
                  <h4 className="text-lg font-extrabold text-slate-900 mb-2">AI Diagnostics</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">Understand the logic behind AI clinical reasoning and report summaries.</p>
               </div>
            </div>

            <div className="space-y-4">
               {faqs.map((faq, i) => (
                  <div key={i} className="glass-card p-6 border-slate-100 hover:border-primary/20 transition-all cursor-pointer">
                     <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{faq.q}</span>
                        <ChevronRight size={18} className="text-slate-300" />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Support Ticket Sidebar */}
         <div className="lg:col-span-12 xl:col-span-4">
            <div className="glass-panel p-8 sticky top-8">
               {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                           <MessageSquare size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Direct Engagement</h3>
                     </div>
                     <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Our clinical support team is available 24/7 for synchronization issues or security reports.
                     </p>
                     
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Engagement Type</label>
                        <select className="input-premium py-4">
                           <option>Technical Synchronization</option>
                           <option>Security Incident</option>
                           <option>Data Correction</option>
                           <option>Feature Suggestion</option>
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Clinical Context</label>
                        <textarea 
                           className="input-premium py-4 min-h-[120px] resize-none" 
                           placeholder="Describe the clinical or technical signal you need help with..."
                        />
                     </div>

                     <button type="submit" className="w-full btn-premium bg-slate-900 text-white py-4 shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                        <Send size={18} />
                        Transmit Support Request
                     </button>
                  </form>
               ) : (
                  <div className="text-center py-12 animate-in zoom-in-95 duration-500">
                     <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                        <CheckCircle2 size={40} />
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 mb-2">Signal Transmitted</h3>
                     <p className="text-sm text-slate-500 font-medium">Your support request has been synchronized with our operations center. Reference: #SYNC-{Math.floor(Math.random() * 90000) + 10000}</p>
                     <button 
                        onClick={() => setSubmitted(false)}
                        className="mt-8 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                     >
                        Initiate New Request
                     </button>
                  </div>
               )}

               <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <Activity className="text-emerald-500" size={18} />
                     <div>
                        <p className="text-xs font-bold text-slate-800 leading-none mb-1">System Pulse</p>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">A-NODE-SYNC: ACTIVE</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Support;
