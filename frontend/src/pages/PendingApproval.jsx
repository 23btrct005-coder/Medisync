import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, ArrowLeft, Mail, Phone, ChevronRight } from 'lucide-react';

const PendingApproval = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Background Aesthetic */}
            <div className="absolute top-0 left-0 w-full h-80 bg-primary-600 rounded-b-[4rem] shadow-lg -z-10" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />

            <div className="max-w-2xl w-full">
                <button 
                    onClick={() => navigate('/login')}
                    className="mb-8 flex items-center gap-2 text-white/80 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
                >
                    <ArrowLeft size={16} /> Back to Login
                </button>

                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="p-10 md:p-16 text-center">
                        <div className="relative inline-block mb-10">
                            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                                <Clock size={48} className="animate-pulse" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-slate-50">
                                <ShieldAlert size={20} className="text-amber-600" />
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase italic mb-4">
                            Verification <span className="not-italic text-primary-600">Pending</span>
                        </h1>
                        
                        <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10 max-w-lg mx-auto">
                            Your professional credentials or institutional profile is currently undergoing administrative verification.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock size={18} className="text-primary-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated Time</span>
                                </div>
                                <p className="text-slate-900 font-bold">Within 24 Hours</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Global Sync Time</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <ShieldAlert size={18} className="text-primary-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Status</span>
                                </div>
                                <p className="text-slate-900 font-bold">Node Isolated</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Awaiting Auth Key</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-primary-50/50 rounded-3xl border border-primary-100/50 text-left flex items-start gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                    <Mail size={18} className="text-primary-600" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Email Notification</h4>
                                    <p className="text-xs text-slate-700 font-medium">We'll send a confirmation code to your registered email once the node is active.</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="flex-1 px-8 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                                >
                                    Return to Dashboard
                                </button>
                                <a 
                                    href="mailto:support@medisync.health"
                                    className="flex-1 px-8 py-5 bg-white text-slate-900 border border-slate-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    Contact Support <ChevronRight size={14} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 border-t border-slate-100 flex items-center justify-center gap-8">
                        <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">+1-800-MEDISYNC</span>
                        </div>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ISO 27001 Certified</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApproval;
